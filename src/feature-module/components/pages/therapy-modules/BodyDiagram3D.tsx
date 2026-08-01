import { Suspense, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

export type BodyPartDef = {
  id: string;
  label: string;
  view: "front" | "back";
  x: number;
  y: number;
  r: number;
};

export type BodyPointMark = {
  part: string;
  severity: number;
  label?: string;
  remark?: string;
  daysSince?: number;
};

type Props = {
  parts: BodyPartDef[];
  marks: BodyPointMark[];
  interactive?: boolean;
  onPartClick?: (part: BodyPartDef) => void;
  severityColor: (s: number) => string;
  height?: number;
};

// Colors chosen to contrast against the light indigo/lavender body material,
// so hotspots are always visible regardless of marked/unmarked state.
const UNMARKED_COLOR = "#f97316"; // orange - pops against #a5b4fc body
const UNMARKED_RING_COLOR = "#ea580c";
const MARK_OUTLINE_COLOR = "#0f172a"; // dark slate ring around marked points

const svgTo3D = (part: BodyPartDef): [number, number, number] => {
  const x = ((part.x - 145) / 100) * 0.78;
  const y = 1.55 - ((part.y - 18) / 312) * 2.55;
  const z = part.view === "front" ? 0.28 : -0.28;
  return [x, y, z];
};

function useTorsoGeometry() {
  return useMemo(() => {
    const points = [
      new THREE.Vector2(0.0, -0.55),
      new THREE.Vector2(0.34, -0.5),
      new THREE.Vector2(0.36, -0.3),
      new THREE.Vector2(0.3, -0.05),
      new THREE.Vector2(0.27, -0.02),
      new THREE.Vector2(0.34, 0.15),
      new THREE.Vector2(0.42, 0.35),
      new THREE.Vector2(0.4, 0.5),
      new THREE.Vector2(0.3, 0.58),
      new THREE.Vector2(0.0, 0.6),
    ];
    const geo = new THREE.LatheGeometry(points, 32);
    geo.scale(1, 1, 0.62);
    return geo;
  }, []);
}

function Humanoid() {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#a5b4fc",
        transparent: false,
        opacity: 1,
        roughness: 0.45,
        metalness: 0.05,
      }),
    []
  );

  const torsoGeo = useTorsoGeometry();

  return (
    <group>
      {/* Head */}
      <mesh position={[0, 1.55, 0]} material={mat} castShadow>
        <sphereGeometry args={[0.24, 24, 24]} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.32, 0]} material={mat}>
        <cylinderGeometry args={[0.08, 0.1, 0.14, 16]} />
      </mesh>
      {/* Torso (tapered, human silhouette) */}
      <mesh position={[0, 0.68, 0]} material={mat} geometry={torsoGeo} castShadow />

      {/* Shoulders */}
      <mesh position={[-0.42, 1.14, 0]} material={mat}>
        <sphereGeometry args={[0.11, 16, 16]} />
      </mesh>
      <mesh position={[0.42, 1.14, 0]} material={mat}>
        <sphereGeometry args={[0.11, 16, 16]} />
      </mesh>

      {/* Left arm (upper) */}
      <mesh position={[-0.46, 0.82, 0]} rotation={[0, 0, 0.05]} material={mat}>
        <capsuleGeometry args={[0.085, 0.42, 6, 12]} />
      </mesh>
      {/* Left arm (forearm) */}
      <mesh position={[-0.5, 0.38, 0]} rotation={[0, 0, 0.03]} material={mat}>
        <capsuleGeometry args={[0.07, 0.38, 6, 12]} />
      </mesh>
      {/* Right arm (upper) */}
      <mesh position={[0.46, 0.82, 0]} rotation={[0, 0, -0.05]} material={mat}>
        <capsuleGeometry args={[0.085, 0.42, 6, 12]} />
      </mesh>
      {/* Right arm (forearm) */}
      <mesh position={[0.5, 0.38, 0]} rotation={[0, 0, -0.03]} material={mat}>
        <capsuleGeometry args={[0.07, 0.38, 6, 12]} />
      </mesh>

      {/* Hands */}
      <mesh position={[-0.52, 0.1, 0]} material={mat}>
        <sphereGeometry args={[0.09, 12, 12]} />
      </mesh>
      <mesh position={[0.52, 0.1, 0]} material={mat}>
        <sphereGeometry args={[0.09, 12, 12]} />
      </mesh>

      {/* Pelvis blend */}
      <mesh position={[0, 0.08, 0]} material={mat}>
        <sphereGeometry args={[0.32, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* Left leg (thigh + calf) */}
      <mesh position={[-0.16, -0.28, 0]} material={mat} castShadow>
        <capsuleGeometry args={[0.14, 0.5, 6, 12]} />
      </mesh>
      <mesh position={[-0.17, -0.85, 0]} material={mat} castShadow>
        <capsuleGeometry args={[0.1, 0.48, 6, 12]} />
      </mesh>
      {/* Right leg (thigh + calf) */}
      <mesh position={[0.16, -0.28, 0]} material={mat} castShadow>
        <capsuleGeometry args={[0.14, 0.5, 6, 12]} />
      </mesh>
      <mesh position={[0.17, -0.85, 0]} material={mat} castShadow>
        <capsuleGeometry args={[0.1, 0.48, 6, 12]} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.17, -1.15, 0.09]} material={mat}>
        <boxGeometry args={[0.15, 0.08, 0.3]} />
      </mesh>
      <mesh position={[0.17, -1.15, 0.09]} material={mat}>
        <boxGeometry args={[0.15, 0.08, 0.3]} />
      </mesh>
    </group>
  );
}

function Hotspot({
  part,
  mark,
  interactive,
  onPartClick,
  severityColor,
}: {
  part: BodyPartDef;
  mark?: BodyPointMark;
  interactive?: boolean;
  onPartClick?: (part: BodyPartDef) => void;
  severityColor: (s: number) => string;
}) {
  const pos = useMemo(() => svgTo3D(part), [part]);
  // Bumped up slightly so points read clearly at default zoom
  const radius = Math.max(0.075, part.r * 0.006);
  const color = mark ? severityColor(mark.severity) : UNMARKED_COLOR;

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (interactive && onPartClick) onPartClick(part);
  };

  return (
    <group position={pos}>
      {/* Core marker sphere - fully opaque so it never blends into the body */}
      <mesh
        onClick={handleClick}
        onPointerOver={() => {
          document.body.style.cursor = interactive ? "pointer" : "default";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent={false}
          opacity={1}
          emissive={color}
          emissiveIntensity={mark ? 0.35 : 0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Contrasting outline ring so the dot pops against any body color/angle */}
      <mesh onClick={handleClick} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.05, radius * 1.4, 24]} />
        <meshBasicMaterial
          color={mark ? MARK_OUTLINE_COLOR : UNMARKED_RING_COLOR}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {mark && (
        <Html center distanceFactor={6} style={{ pointerEvents: "none", userSelect: "none" }}>
          <div
            style={{
              color: "#fff",
              fontWeight: 800,
              fontSize: 11,
              textShadow: "0 1px 2px rgba(0,0,0,0.6)",
            }}
          >
            {mark.severity}
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({
  parts,
  marks,
  interactive,
  onPartClick,
  severityColor,
}: Omit<Props, "height">) {
  const controlsRef = useRef<any>(null);
  const markMap = useMemo(() => {
    const m = new Map<string, BodyPointMark>();
    marks.forEach((bp) => m.set(bp.part, bp));
    return m;
  }, [marks]);

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 2, -4]} intensity={0.35} />
      <Humanoid />
      {parts.map((part) => (
        <Hotspot
          key={part.id}
          part={part}
          mark={markMap.get(part.id)}
          interactive={interactive}
          onPartClick={onPartClick}
          severityColor={severityColor}
        />
      ))}
      <ContactShadows position={[0, -1.2, 0]} opacity={0.35} scale={6} blur={2.5} far={3} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom
        minDistance={2.2}
        maxDistance={5.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.7}
        target={[0, 0.2, 0]}
        rotateSpeed={0.85}
      />
    </>
  );
}

const BodyDiagram3D = ({
  parts,
  marks,
  interactive = true,
  onPartClick,
  severityColor,
  height = 380,
}: Props) => {
  return (
    <div
      className="body-diagram-3d position-relative w-100"
      style={{
        height,
        borderRadius: 12,
        overflow: "hidden",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0.4, 3.2], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      >
        <Suspense fallback={null}>
          <Scene
            parts={parts}
            marks={marks}
            interactive={interactive}
            onPartClick={onPartClick}
            severityColor={severityColor}
          />
        </Suspense>
      </Canvas>
      <div
        className="position-absolute top-0 start-0 m-2 px-2 py-1 rounded-pill"
        style={{
          background: "rgba(255,255,255,0.9)",
          border: "1px solid #e2e8f0",
          fontSize: 11,
          fontWeight: 600,
          color: "#64748b",
          pointerEvents: "none",
        }}
      >
        <i className="ti ti-rotate me-1" />
        Drag to rotate 360°
      </div>
    </div>
  );
};

export default BodyDiagram3D;