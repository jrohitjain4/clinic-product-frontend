import { Suspense, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Billboard, ContactShadows, Html } from "@react-three/drei";
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
  /** Fixed height in px, or omit when fillParent is true */
  height?: number;
  /** Stretch to fill parent card height */
  fillParent?: boolean;
  /** Part currently being edited — shows live severity color before Save */
  previewPartId?: string | null;
  previewSeverity?: number;
};

const UNMARKED_BORDER = "#f97316";
/** Same size for every hotspot so borders look identical */
const CIRCLE_RADIUS = 0.078;
/** Fixed stroke width in world units (not proportional to part.r) */
const BORDER_WIDTH = 0.014;

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
      <mesh position={[0, 1.55, 0]} material={mat} castShadow>
        <sphereGeometry args={[0.24, 24, 24]} />
      </mesh>
      <mesh position={[0, 1.32, 0]} material={mat}>
        <cylinderGeometry args={[0.08, 0.1, 0.14, 16]} />
      </mesh>
      <mesh position={[0, 0.68, 0]} material={mat} geometry={torsoGeo} castShadow />

      <mesh position={[-0.42, 1.14, 0]} material={mat}>
        <sphereGeometry args={[0.11, 16, 16]} />
      </mesh>
      <mesh position={[0.42, 1.14, 0]} material={mat}>
        <sphereGeometry args={[0.11, 16, 16]} />
      </mesh>

      <mesh position={[-0.46, 0.82, 0]} rotation={[0, 0, 0.05]} material={mat}>
        <capsuleGeometry args={[0.085, 0.42, 6, 12]} />
      </mesh>
      <mesh position={[-0.5, 0.38, 0]} rotation={[0, 0, 0.03]} material={mat}>
        <capsuleGeometry args={[0.07, 0.38, 6, 12]} />
      </mesh>
      <mesh position={[0.46, 0.82, 0]} rotation={[0, 0, -0.05]} material={mat}>
        <capsuleGeometry args={[0.085, 0.42, 6, 12]} />
      </mesh>
      <mesh position={[0.5, 0.38, 0]} rotation={[0, 0, -0.03]} material={mat}>
        <capsuleGeometry args={[0.07, 0.38, 6, 12]} />
      </mesh>

      <mesh position={[-0.52, 0.1, 0]} material={mat}>
        <sphereGeometry args={[0.09, 12, 12]} />
      </mesh>
      <mesh position={[0.52, 0.1, 0]} material={mat}>
        <sphereGeometry args={[0.09, 12, 12]} />
      </mesh>

      <mesh position={[0, 0.08, 0]} material={mat}>
        <sphereGeometry args={[0.32, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      <mesh position={[-0.16, -0.28, 0]} material={mat} castShadow>
        <capsuleGeometry args={[0.14, 0.5, 6, 12]} />
      </mesh>
      <mesh position={[-0.17, -0.85, 0]} material={mat} castShadow>
        <capsuleGeometry args={[0.1, 0.48, 6, 12]} />
      </mesh>
      <mesh position={[0.16, -0.28, 0]} material={mat} castShadow>
        <capsuleGeometry args={[0.14, 0.5, 6, 12]} />
      </mesh>
      <mesh position={[0.17, -0.85, 0]} material={mat} castShadow>
        <capsuleGeometry args={[0.1, 0.48, 6, 12]} />
      </mesh>

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
  isPreview,
  previewSeverity,
}: {
  part: BodyPartDef;
  mark?: BodyPointMark;
  interactive?: boolean;
  onPartClick?: (part: BodyPartDef) => void;
  severityColor: (s: number) => string;
  isPreview?: boolean;
  previewSeverity?: number;
}) {
  const pos = useMemo(() => svgTo3D(part), [part]);
  const radius = CIRCLE_RADIUS;
  const ringInner = radius - BORDER_WIDTH;

  const isFilled = Boolean(isPreview || mark);
  let fillColor = UNMARKED_BORDER;
  let severityNum: number | null = null;
  if (isPreview && previewSeverity != null) {
    fillColor = severityColor(previewSeverity);
    severityNum = previewSeverity;
  } else if (mark) {
    fillColor = severityColor(mark.severity);
    severityNum = mark.severity;
  }

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (interactive && onPartClick) onPartClick(part);
  };

  const pointerHandlers = {
    onClick: handleClick,
    onPointerOver: () => {
      document.body.style.cursor = interactive ? "pointer" : "default";
    },
    onPointerOut: () => {
      document.body.style.cursor = "default";
    },
  };

  return (
    <group position={pos}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {isFilled ? (
          <>
            <mesh {...pointerHandlers}>
              <circleGeometry args={[radius, 32]} />
              <meshBasicMaterial
                color={fillColor}
                toneMapped={false}
                side={THREE.DoubleSide}
                depthTest
                depthWrite
              />
            </mesh>
            {severityNum != null && (
              <Html
                center
                distanceFactor={8}
                style={{ pointerEvents: "none", userSelect: "none" }}
                zIndexRange={[10, 0]}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 8,
                    lineHeight: 1,
                    textShadow: "0 1px 2px rgba(0,0,0,0.55)",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {severityNum}
                </div>
              </Html>
            )}
          </>
        ) : (
          <>
            <mesh {...pointerHandlers}>
              <ringGeometry args={[ringInner, radius, 32]} />
              <meshBasicMaterial
                color={UNMARKED_BORDER}
                toneMapped={false}
                side={THREE.DoubleSide}
                depthTest
                depthWrite
              />
            </mesh>
            <mesh {...pointerHandlers}>
              <circleGeometry args={[radius, 32]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          </>
        )}
      </Billboard>
    </group>
  );
}

function Scene({
  parts,
  marks,
  interactive,
  onPartClick,
  severityColor,
  previewPartId,
  previewSeverity,
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
          isPreview={previewPartId === part.id}
          previewSeverity={previewSeverity}
        />
      ))}
      <ContactShadows position={[0, -1.2, 0]} opacity={0.3} scale={7} blur={2.5} far={3} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom
        minDistance={3.8}
        maxDistance={7.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.65}
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
  fillParent = false,
  previewPartId = null,
  previewSeverity,
}: Props) => {
  return (
    <div
      className="body-diagram-3d position-relative w-100"
      style={
        fillParent
          ? {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              borderRadius: 12,
              overflow: "hidden",
              background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
            }
          : {
              height,
              borderRadius: 12,
              overflow: "hidden",
              background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
            }
      }
    >
      <Canvas
        shadows
        // Zoomed-out default so full body fits like a standing figure
        camera={{ position: [0, 0.25, 5.2], fov: 38 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%", touchAction: "none", display: "block" }}
      >
        <Suspense fallback={null}>
          <Scene
            parts={parts}
            marks={marks}
            interactive={interactive}
            onPartClick={onPartClick}
            severityColor={severityColor}
            previewPartId={previewPartId}
            previewSeverity={previewSeverity}
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
