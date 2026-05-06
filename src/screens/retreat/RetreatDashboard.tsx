import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserPlus, PiggyBank, Target, ArrowLeft, Search, Cake, Eye, EyeOff } from 'lucide-react-native';
import { RootStackParamList } from '../../types';
import { theme } from '../../styles/theme';
import { useRetreatStats } from '../../hooks/useRetreat';
import { RetreatService } from '../../services/RetreatService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RetreatDashboard() {
    const navigation = useNavigation<NavigationProp>();
    const { data: stats, isLoading } = useRetreatStats();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showBalance, setShowBalance] = React.useState(false);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const filteredYouths = stats?.youthsWithProgress.filter((y: any) => 
        y.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const percentageTotal = stats?.totalTarget ? Math.min((stats.totalSavings / stats.totalTarget) * 100, 100) : 0;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Retiro 2026</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Global Stats */}
            <TouchableOpacity 
                style={styles.globalCard} 
                onPress={() => setShowBalance(!showBalance)}
                activeOpacity={0.8}
            >
                <View style={styles.globalTitleRow}>
                    <Text style={styles.globalTitle}>Ahorro Total Global</Text>
                    {showBalance ? <Eye size={16} color="#9CA3AF" /> : <EyeOff size={16} color="#9CA3AF" />}
                </View>
                <Text style={styles.globalAmount}>
                    {showBalance ? `$${stats?.totalSavings.toLocaleString('es-CO')}` : '••••••'}
                </Text>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${percentageTotal}%` }]} />
                </View>
                <Text style={styles.globalSubtitle}>
                    Meta Global: ${stats?.totalTarget.toLocaleString('es-CO')}
                </Text>
            </TouchableOpacity>

            {/* Actions */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('NewRetreatSaving')}
                >
                    <PiggyBank color="#fff" size={28} />
                    <Text style={styles.actionText}>Abonar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => navigation.navigate('RegisterYouth')}
                >
                    <UserPlus color="#fff" size={28} />
                    <Text style={styles.actionText}>Nuevo Joven</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Search color="#9CA3AF" size={20} />
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Buscar joven..." 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Youth List */}
            <Text style={styles.sectionTitle}>Progreso por Joven</Text>
            
            {filteredYouths.map((youth: any) => (
                <TouchableOpacity 
                    key={youth.id} 
                    style={styles.youthCard}
                    onPress={() => navigation.navigate('YouthDetails', { youthId: youth.id })}
                >
                    <View style={styles.youthHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.genderAvatar}>
                                {youth.gender === 'female' ? '👩' : '👨'}
                            </Text>
                            <Text style={styles.youthName}>{youth.name}</Text>
                            {RetreatService.isBirthdayThisWeek(youth.birthDate) && (
                                <Cake color="#F472B6" size={16} />
                            )}
                        </View>
                        <Text style={styles.youthProgressText}>
                            {Math.round(youth.progressPercentage)}%
                        </Text>
                    </View>
                    
                    <View style={styles.progressContainerSmall}>
                        <View style={[styles.progressBarSmall, { width: `${Math.min(youth.progressPercentage, 100)}%` }]} />
                    </View>
                    
                    <View style={styles.youthFooter}>
                        <Text style={styles.youthSaved}>
                            ${youth.totalSaved.toLocaleString('es-CO')} ahorrados
                        </Text>
                        <Text style={styles.youthTarget}>
                            Meta: ${youth.targetAmount.toLocaleString('es-CO')}
                        </Text>
                    </View>
                </TouchableOpacity>
            ))}

            {filteredYouths.length === 0 && (
                <View style={styles.emptyState}>
                    <Target color="#ccc" size={48} />
                    <Text style={styles.emptyText}>No se encontraron resultados.</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: 40 },
    header: {
        backgroundColor: '#8B5CF6', // Purple color for the retreat module
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 50,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    backButton: { padding: 8 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    globalCard: {
        backgroundColor: '#fff',
        margin: 20,
        marginTop: -30,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    globalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    globalTitle: { fontSize: 16, color: '#6B7280' },
    globalAmount: { fontSize: 36, fontWeight: 'bold', color: '#8B5CF6', marginBottom: 16 },
    progressContainer: {
        width: '100%',
        height: 12,
        backgroundColor: '#EDE9FE',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 6 },
    globalSubtitle: { fontSize: 14, color: '#9CA3AF' },
    actionRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionButton: {
        backgroundColor: '#8B5CF6',
        flex: 1,
        marginRight: 10,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    secondaryButton: {
        backgroundColor: '#10B981',
        marginRight: 0,
        marginLeft: 10,
        shadowColor: '#10B981',
    },
    actionText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#1F2937',
    },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginHorizontal: 20, marginBottom: 16 },
    youthCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    youthHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    genderAvatar: { fontSize: 20 },
    youthName: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
    youthProgressText: { fontSize: 16, fontWeight: 'bold', color: '#8B5CF6' },
    progressContainerSmall: {
        width: '100%',
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBarSmall: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 3 },
    youthFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    youthSaved: { fontSize: 14, color: '#10B981', fontWeight: '600' },
    youthTarget: { fontSize: 14, color: '#9CA3AF' },
    emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#6B7280' }
});
