import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Organic low-poly "seed pod" cluster — the brand's 3D signature.
 * Sage/clay/mustard stones drifting in warm light. Deliberately slow.
 *
 * R3F RULE: useFrame/useThree may ONLY be called from components
 * rendered INSIDE <Canvas>. All motion lives in <Rig/> below.
 */

function Stone({ position, scale, color, speed, rotationSpeed }) {
    const mesh = useRef();
    // Stable geometry per stone instance
    const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (!mesh.current) return;
        mesh.current.position.y = position[1] + Math.sin(t * speed) * 0.18;
        mesh.current.rotation.x = t * rotationSpeed;
        mesh.current.rotation.y = t * rotationSpeed * 0.7;
    });

    return (
        <mesh ref={mesh} position={position} scale={scale} geometry={geometry}>
            <meshStandardMaterial color={color} flatShading roughness={0.85} metalness={0.05} />
        </mesh>
    );
}

/* Pointer-parallax rig — lives INSIDE the Canvas where R3F hooks are legal */
function Rig({ children }) {
    const group = useRef();

    useFrame((state) => {
        if (!group.current) return;
        const { x, y } = state.pointer;
        group.current.rotation.y += (x * 0.12 - group.current.rotation.y) * 0.03;
        group.current.rotation.x += (-y * 0.08 - group.current.rotation.x) * 0.03;
    });

    return <group ref={group}>{children}</group>;
}

const STONES = [
    { position: [-2.6, 0.4, -1], scale: 0.9, color: '#75836B', speed: 0.5, rotationSpeed: 0.12 },   // sage
    { position: [2.4, -0.3, -0.5], scale: 0.65, color: '#C07A50', speed: 0.65, rotationSpeed: 0.16 }, // clay
    { position: [0.8, 0.9, -1.5], scale: 0.5, color: '#C79A2E', speed: 0.55, rotationSpeed: 0.2 },   // mustard
    { position: [-0.9, -0.8, -0.8], scale: 0.42, color: '#57708A', speed: 0.72, rotationSpeed: 0.14 },// vintage blue
    { position: [1.7, 0.5, -2], scale: 0.35, color: '#B25B3F', speed: 0.48, rotationSpeed: 0.22 },   // rust
];

export default function StoneField() {
    return (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 42 }}
                dpr={[1, 1.75]}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                {/* Warm studio light */}
                <ambientLight intensity={0.75} color="#F3EFE7" />
                <directionalLight position={[4, 6, 3]} intensity={1.1} color="#FFF6E8" />
                <directionalLight position={[-5, -2, -2]} intensity={0.25} color="#DCE3D4" />

                <Rig>
                    {STONES.map((s, i) => (
                        <Stone key={i} {...s} />
                    ))}
                </Rig>
            </Canvas>
        </div>
    );
}
