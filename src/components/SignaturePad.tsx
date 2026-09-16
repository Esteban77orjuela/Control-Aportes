'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import SignaturePad from 'signature_pad';

export interface SignaturePadRef {
  getSignature: () => string;
  clear: () => void;
  isEmpty: () => boolean;
}

interface SignaturePadOptions {
  dotSize?: number;
  minWidth?: number;
  maxWidth?: number;
  throttle?: number;
  minDistance?: number;
  backgroundColor?: string;
  penColor?: string;
  velocityFilterWeight?: number;
  onBegin?: (event: MouseEvent) => void;
  onEnd?: (event: MouseEvent) => void;
}

interface SignaturePadProps {
  height?: number;
  width?: number;
  penColor?: string;
  backgroundColor?: string;
  disabled?: boolean;
  onBegin?: () => void;
  onEnd?: () => void;
}

export const SignaturePadComponent = forwardRef<SignaturePadRef, SignaturePadProps>(
  (props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const padRef = useRef<SignaturePad | null>(null);
    const { height = 200, width, penColor = '#1f2937', backgroundColor = '#ffffff', disabled = false, onBegin, onEnd } = props;

    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ratio = window.devicePixelRatio || 1;

      canvas.width = (width || canvas.offsetWidth || 300) * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width || canvas.offsetWidth || 300}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }

      const options: SignaturePadOptions = {
        penColor,
        backgroundColor,
        minWidth: 1,
        maxWidth: 3,
        velocityFilterWeight: 0.7,
      };

      if (onBegin) {
        options.onBegin = (event: MouseEvent) => onBegin();
      }
      if (onEnd) {
        options.onEnd = (event: MouseEvent) => onEnd();
      }

      padRef.current = new SignaturePad(canvas, options);

      if (disabled) {
        padRef.current.off();
      } else {
        padRef.current.on();
      }

      return () => {
        if (padRef.current) {
          padRef.current.off();
        }
      };
    }, [width, height, penColor, backgroundColor, disabled, onBegin, onEnd]);

    const resize = () => {
      if (!canvasRef.current || !padRef.current) return;
      const canvas = canvasRef.current;
      const ratio = window.devicePixelRatio || 1;
      const data = padRef.current.toData();

      canvas.width = (width || canvas.offsetWidth || 300) * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width || canvas.offsetWidth || 300}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }

      padRef.current.fromData(data);
    };

    useEffect(() => {
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }, [width, height]);

    useImperativeHandle(ref, () => ({
      getSignature: () => padRef.current?.toDataURL('image/png') || '',
      clear: () => padRef.current?.clear(),
      isEmpty: () => padRef.current?.isEmpty() ?? true,
    }));

    return (
      <View style={[styles.container, { height, width: width || '100%' }]}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          {...{ touchAction: 'none' }}
        />
      </View>
    );
  }
);

SignaturePadComponent.displayName = 'SignaturePad';

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  canvas: {
    flex: 1,
    width: '100%',
  },
});