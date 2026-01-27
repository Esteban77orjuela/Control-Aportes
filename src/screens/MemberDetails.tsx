import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, FlatList, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarChart } from 'react-native-chart-kit';
import { Trash2, Edit2 } from 'lucide-react-native';
import { getPersonById, getPaymentsByPerson, deletePerson } from '../utils/storage';
import { Person, Payment, RootStackParamList } from '../types';
import { theme } from '../styles/theme';

type MemberDetailsRouteProp = RouteProp<RootStackParamList, 'MemberDetails'>;
type MemberDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MemberDetails'>;

const screenWidth = Dimensions.get('window').width;

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function MemberDetails() {
    const route = useRoute<MemberDetailsRouteProp>();
    const navigation = useNavigation<MemberDetailsNavigationProp>();
    const { personId } = route.params;

    const [person, setPerson] = useState<Person | undefined>(undefined);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [personId, navigation]);

    const loadData = async () => {
        setLoading(true);
        const p = await getPersonById(personId);
        const pays = await getPaymentsByPerson(personId);
        setPerson(p);
        setPayments(pays);
        setLoading(false);
    };

    const handleDelete = () => {
        Alert.alert(
            "Eliminar Miembro",
            "¿Estás seguro de que deseas eliminar a este miembro? Esta acción también borrará todos sus pagos registrados y no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deletePerson(personId);
                            navigation.goBack();
                        } catch (e) {
                            Alert.alert("Error", "No se pudo eliminar el miembro.");
                        }
                    }
                }
            ]
        );
    };

    const renderStatusGrid = () => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        return (
            <View style={styles.gridContainer}>
                {MONTHS.map((month, index) => {
                    // Check if paid in this month & year
                    const isPaid = payments.some(p => p.month === index && p.year === currentYear);
                    const isFuture = index > currentMonth;
                    const isPastDue = !isPaid && !isFuture;

                    let bgColor = '#E5E7EB'; // Gray (Future)
                    let textColor = '#9CA3AF';

                    if (isPaid) {
                        bgColor = theme.colors.success; // Green
                        textColor = '#fff';
                    } else if (isPastDue) {
                        bgColor = theme.colors.error; // Red
                        textColor = '#fff';
                    }

                    return (
                        <View key={index} style={[styles.gridItem, { backgroundColor: bgColor }]}>
                            <Text style={[styles.gridText, { color: textColor }]}>{month}</Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    const getChartData = () => {
        // Last 6 months
        const data = [0, 0, 0, 0, 0, 0];
        const labels = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            labels.push(MONTHS[d.getMonth()]);

            // aggregate
            const total = payments
                .filter(p => p.month === d.getMonth() && p.year === d.getFullYear())
                .reduce((sum, p) => sum + p.amount, 0);
            data[5 - i] = total;
        }

        return {
            labels: labels,
            datasets: [{ data }]
        };
    };

    const renderPaymentItem = ({ item }: { item: Payment }) => (
        <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
                <Text style={styles.paymentDate}>{item.date}</Text>
                <Text style={styles.paymentAmount}>${item.amount}</Text>
            </View>
            <Text style={styles.signatureLabel}>Firma:</Text>
            <View style={styles.signaturePreview}>
                <Image
                    source={{ uri: item.signatureBase64 }}
                    style={{ width: '100%', height: 80, resizeMode: 'contain' }}
                />
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
    }

    if (!person) return <View><Text>Miembro no encontrado</Text></View>;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditMember', { personId })}>
                    <Edit2 size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Trash2 size={24} color={theme.colors.error} />
                </TouchableOpacity>
                <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>{person.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.name}>{person.name}</Text>
                <Text style={styles.email}>{person.email}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Estado Anual ({new Date().getFullYear()})</Text>
                {renderStatusGrid()}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Historial Reciente</Text>
                <BarChart
                    data={getChartData()}
                    width={screenWidth - 40}
                    height={220}
                    yAxisLabel="$"
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`, // Primary color
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: { borderRadius: 16 }
                    }}
                    style={styles.chart}
                    yAxisSuffix=""
                    fromZero
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Listado de Pagos</Text>
                {payments.map(item => (
                    <View key={item.id} style={{ marginBottom: 10 }}>
                        {renderPaymentItem({ item })}
                    </View>
                ))}
                {payments.length === 0 && <Text style={{ textAlign: 'center', color: '#999' }}>Sin pagos aún.</Text>}
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>© {new Date().getFullYear()} Control de Aportes</Text>
                <Text style={styles.footerSubText}>Todos los derechos reservados por Esteban Orjuela</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#fff',
        ...theme.shadows.default,
        position: 'relative',
    },
    deleteBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 10,
    },
    editBtn: {
        position: 'absolute',
        top: 20,
        right: 60, // Positioned next to delete button
        padding: 10,
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarTextLarge: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    email: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 15,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '23%',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    gridText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    chart: {
        borderRadius: 16,
        ...theme.shadows.card,
    },
    paymentCard: { // Renamed from paymentItem to avoid conflict or confusion
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    paymentDate: {
        color: theme.colors.textSecondary,
    },
    paymentAmount: {
        fontWeight: 'bold',
        color: theme.colors.success,
    },
    signatureLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 5,
    },
    signaturePreview: {
        height: 80,
        backgroundColor: '#F9FAFB',
        borderRadius: 4,
    },
    footer: {
        marginTop: 30,
        marginBottom: 40,
        alignItems: 'center',
        opacity: 0.6,
    },
    footerText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: 'bold',
    },
    footerSubText: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
});
