import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, PanResponder, LayoutChangeEvent, Alert } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import Svg, { Circle, Line } from 'react-native-svg';
import { X, Play, Pause, RotateCcw, Activity, Ruler } from 'lucide-react-native';

interface SkeletalTrackerProps {
  visible: boolean;
  onClose: () => void;
  videoUri: string;
  clientName?: string;
  exerciseName?: string;
}

type JointKey =
  | 'nose'
  | 'leftEye'
  | 'rightEye'
  | 'leftEar'
  | 'rightEar'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftWrist'
  | 'rightWrist'
  | 'leftHip'
  | 'rightHip'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftAnkle'
  | 'rightAnkle';

interface JointPoint {
  key: JointKey;
  x: number;
  y: number;
  confidence?: number;
}

const JOINT_ORDER: JointKey[] = [
  'nose',
  'leftEye',
  'rightEye',
  'leftEar',
  'rightEar',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
];

const SKELETON_CONNECTIONS: [JointKey, JointKey][] = [
  ['leftShoulder', 'rightShoulder'],
  ['leftHip', 'rightHip'],
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
];

export default function SkeletalTracker({ visible, onClose, videoUri, clientName, exerciseName }: SkeletalTrackerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoLayout, setVideoLayout] = useState<{ width: number; height: number } | null>(null);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [activeJoint, setActiveJoint] = useState<JointKey | null>(null);

  const [joints, setJoints] = useState<Partial<Record<JointKey, JointPoint>>>({});

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          if (!videoLayout) return;
          const { locationX, locationY } = evt.nativeEvent;
          if (activeJoint) {
            setJoints((prev) => ({
              ...prev,
              [activeJoint]: { key: activeJoint, x: locationX, y: locationY },
            }));
          }
        },
        onPanResponderMove: (evt) => {
          if (!videoLayout) return;
          if (!activeJoint) return;
          const { locationX, locationY } = evt.nativeEvent;
          setJoints((prev) => ({
            ...prev,
            [activeJoint]: { key: activeJoint, x: clamp(locationX, 0, videoLayout.width), y: clamp(locationY, 0, videoLayout.height) },
          }));
        },
      }),
    [activeJoint, videoLayout]
  );

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying ?? false);
  };

  const togglePlayback = async () => {
    if (!videoRef.current) return;
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (e) {
      console.log('togglePlayback error', e);
    }
  };

  const onLayoutVideo = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setVideoLayout({ width, height });
  };

  const reset = () => {
    setJoints({} as Partial<Record<JointKey, JointPoint>>);
    setActiveJoint(null);
  };

  const placeAllGuidance = () => {
    if (!videoLayout) return;
    const midX = videoLayout.width / 2;
    // headY placeholder if needed later
    const shoulderY = videoLayout.height * 0.3;
    const hipY = videoLayout.height * 0.5;
    const kneeY = videoLayout.height * 0.7;
    const ankleY = videoLayout.height * 0.9;

    setJoints(prev => ({
      ...prev,
      leftShoulder: { key: 'leftShoulder', x: midX - 40, y: shoulderY },
      rightShoulder: { key: 'rightShoulder', x: midX + 40, y: shoulderY },
      leftHip: { key: 'leftHip', x: midX - 30, y: hipY },
      rightHip: { key: 'rightHip', x: midX + 30, y: hipY },
      leftKnee: { key: 'leftKnee', x: midX - 28, y: kneeY },
      rightKnee: { key: 'rightKnee', x: midX + 28, y: kneeY },
      leftAnkle: { key: 'leftAnkle', x: midX - 26, y: ankleY },
      rightAnkle: { key: 'rightAnkle', x: midX + 26, y: ankleY },
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Skeletal Analysis</Text>
            {!!clientName && !!exerciseName && (
              <Text style={styles.subtitle}>{clientName} - {exerciseName}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={reset}>
            <RotateCcw color="#fff" size={22} />
          </TouchableOpacity>
        </View>

        <View style={styles.videoArea}>
          <View style={styles.videoWrapper} onLayout={onLayoutVideo} {...panResponder.panHandlers}>
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping={false}
              useNativeControls={false}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            />

            {videoLayout && (
              <View style={styles.overlayContainer}>
                <Svg style={styles.overlay} width={videoLayout.width} height={videoLayout.height}>
                  {/* Guides */}
                  {showGuides && (
                    <>
                      {/* Midline */}
                      <Line x1={videoLayout.width / 2} y1={0} x2={videoLayout.width / 2} y2={videoLayout.height} stroke="#6366f1" strokeDasharray="6,6" strokeWidth={1} />
                      {/* Shoulder/Hip lines */}
                      {joints.leftShoulder && joints.rightShoulder && (
                        <Line x1={joints.leftShoulder.x} y1={joints.leftShoulder.y} x2={joints.rightShoulder.x} y2={joints.rightShoulder.y} stroke="#10b981" strokeDasharray="6,6" strokeWidth={2} />
                      )}
                      {joints.leftHip && joints.rightHip && (
                        <Line x1={joints.leftHip.x} y1={joints.leftHip.y} x2={joints.rightHip.x} y2={joints.rightHip.y} stroke="#10b981" strokeDasharray="6,6" strokeWidth={2} />
                      )}
                    </>
                  )}

                  {/* Skeleton connections */}
                  {SKELETON_CONNECTIONS.map(([a, b]) => {
                    const ja = joints[a];
                    const jb = joints[b];
                    if (!ja || !jb) return null;
                    return (
                      <Line
                        key={`${a}-${b}`}
                        x1={ja.x}
                        y1={ja.y}
                        x2={jb.x}
                        y2={jb.y}
                        stroke="#f59e0b"
                        strokeWidth={3}
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Joints */}
                  {JOINT_ORDER.map((k) => {
                    const jp = joints[k];
                    if (!jp) return null;
                    const selected = activeJoint === k;
                    return (
                      <Circle
                        key={`joint-${k}`}
                        cx={jp.x}
                        cy={jp.y}
                        r={selected ? 10 : 7}
                        fill={selected ? '#ef4444' : '#22c55e'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  })}
                </Svg>
              </View>
            )}
          </View>
        </View>

        <View style={styles.controls}>
          <View style={styles.playbackRow}>
            <TouchableOpacity style={styles.playBtn} onPress={togglePlayback} testID="skeletal-play">
              {isPlaying ? <Pause color="#fff" size={22} /> : <Play color="#fff" size={22} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.guideBtn} onPress={() => setShowGuides((v) => !v)}>
              <Ruler color="#fff" size={18} />
              <Text style={styles.guideText}>{showGuides ? 'Guides On' : 'Guides Off'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.autoBtn} onPress={() => {
              placeAllGuidance();
              Alert.alert('Placed', 'Starter joints placed. Drag to fine-tune.');
            }}>
              <Activity color="#fff" size={18} />
              <Text style={styles.guideText}>Auto Place</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.jointRow}>
            {JOINT_ORDER.filter((k) => ['leftShoulder','rightShoulder','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'].includes(k)).map((k) => (
              <TouchableOpacity
                key={`selector-${k}`}
                style={[styles.jointBtn, activeJoint === k && styles.jointBtnActive]}
                onPress={() => setActiveJoint(k)}
              >
                <View style={[styles.jointDot, { backgroundColor: activeJoint === k ? '#ef4444' : '#22c55e' }]} />
                <Text style={styles.jointLabel}>{formatJoint(k)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function formatJoint(k: JointKey) {
  return k.replace('left', 'L ').replace('right', 'R ').replace(/([A-Z])/g, ' $1');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)'
  },
  iconBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' as const },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  videoArea: { flex: 1, margin: 20, borderRadius: 16, overflow: 'hidden' },
  videoWrapper: { flex: 1, position: 'relative' },
  video: { flex: 1 },
  overlayContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  controls: { paddingHorizontal: 20, paddingBottom: 24 },
  playbackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  playBtn: { backgroundColor: 'rgba(255,255,255,0.2)', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  guideBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(99,102,241,0.25)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20 },
  autoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.25)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20 },
  guideText: { color: '#fff', marginLeft: 6, fontSize: 12 },
  jointRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  jointBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 16 },
  jointBtnActive: { backgroundColor: 'rgba(239,68,68,0.25)' },
  jointDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  jointLabel: { color: '#fff', fontSize: 12 },
});