import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

const COLORS = [
  new THREE.Color("#4285F4"),
  new THREE.Color("#EA4335"),
  new THREE.Color("#FBBC05"),
  new THREE.Color("#34A853"),
];

interface MouseState {
  x: number;
  y: number;
}

function PixelerionCore({
  mouse,
}: {
  mouse: React.MutableRefObject<MouseState>;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRefs = useRef<THREE.Mesh[]>([]);

  const blocks = useMemo(() => {
    const items = [];
    const positions = [
      [0, 0, 0],
      [1.2, 0.3, -0.5],
      [-1.2, 0.3, -0.5],
      [0, 1.2, 0],
      [0.6, -0.8, 0.4],
      [-0.6, -0.8, 0.4],
      [1.5, -0.5, 0.2],
      [-1.5, -0.5, 0.2],
      [0, 0, 1.2],
      [0.8, 1.0, 0.6],
      [-0.8, 1.0, 0.6],
      [1.2, -1.2, -0.3],
    ];
    for (let i = 0; i < positions.length; i++) {
      const [x, y, z] = positions[i];
      items.push({
        position: new THREE.Vector3(x, y, z),
        scale: 0.2 + Math.random() * 0.25,
        color: COLORS[i % 4],
        speed: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return items;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.08 + mouse.current.x * 0.3;
      groupRef.current.rotation.x = mouse.current.y * 0.15;
    }
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const b = blocks[i];
      mesh.position.y = b.position.y + Math.sin(t * b.speed + b.phase) * 0.12;
      mesh.rotation.x = t * 0.3 + b.phase;
      mesh.rotation.z = t * 0.2;
    });
  });

  return (
    <group ref={groupRef}>
      {blocks.map((block, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshRefs.current[i] = el;
          }}
          position={block.position}
        >
          <boxGeometry args={[block.scale, block.scale, block.scale]} />
          <meshStandardMaterial
            color={block.color}
            emissive={block.color}
            emissiveIntensity={0.4}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function ConnectionLines() {
  const groupRef = useRef<THREE.Group>(null!);

  const lineObjects = useMemo(() => {
    const pts = [
      [0, 0, 0],
      [1.2, 0.3, -0.5],
      [-1.2, 0.3, -0.5],
      [0, 1.2, 0],
      [0.6, -0.8, 0.4],
      [-0.6, -0.8, 0.4],
    ] as [number, number, number][];
    const pairs = [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [0, 4],
      [0, 5],
      [4, 5],
      [1, 4],
      [2, 5],
    ];
    const group = new THREE.Group();
    pairs.forEach(([a, b]) => {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...pts[a]!),
        new THREE.Vector3(...pts[b]!),
      ]);
      const mat = new THREE.LineBasicMaterial({
        color: COLORS[a % 4],
        transparent: true,
        opacity: 0.2,
      });
      group.add(new THREE.Line(geom, mat));
    });
    return group;
  }, []);

  useFrame(({ clock }) => {
    lineObjects.rotation.y = clock.elapsedTime * 0.08;
    if (groupRef.current)
      groupRef.current.rotation.y = clock.elapsedTime * 0.08;
  });

  return <primitive ref={groupRef} object={lineObjects} />;
}

function Particles() {
  const count = 120;
  const particlesRef = useRef<THREE.Points>(null!);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      vel[i * 3] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(() => {
    if (!particlesRef.current) return;
    const pos = particlesRef.current.geometry.attributes.position!
      .array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];
      if (Math.abs(pos[i * 3]) > 4) velocities[i * 3] *= -1;
      if (Math.abs(pos[i * 3 + 1]) > 4) velocities[i * 3 + 1] *= -1;
      if (Math.abs(pos[i * 3 + 2]) > 4) velocities[i * 3 + 2] *= -1;
    }
    particlesRef.current.geometry.attributes.position!.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#ffffff"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

function Scene({ mouse }: { mouse: React.MutableRefObject<MouseState> }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[4, 4, 4]} color="#4285F4" intensity={2} />
      <pointLight position={[-4, -2, 4]} color="#EA4335" intensity={1.5} />
      <pointLight position={[0, 4, -4]} color="#FBBC05" intensity={1.5} />
      <pointLight position={[-4, 2, -4]} color="#34A853" intensity={1.5} />
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <PixelerionCore mouse={mouse} />
      </Float>
      <ConnectionLines />
      <Particles />
    </>
  );
}

export default function HeroCanvas() {
  const mouse = useRef<MouseState>({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <Scene mouse={mouse} />
      </Canvas>
    </div>
  );
}
