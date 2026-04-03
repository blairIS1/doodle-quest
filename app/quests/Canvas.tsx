"use client";
import { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import type { Point, Stroke } from "./data";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308"];
const LINE_WIDTH = 8;

export type CanvasHandle = { toDataURL: () => string };

type Props = {
  width?: number;
  height?: number;
  onStrokesChange?: (strokes: Stroke[]) => void;
};

const Canvas = forwardRef<CanvasHandle, Props>(function Canvas({ width = 340, height = 340, onStrokesChange }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Point[]>([]);
  const colorRef = useRef(COLORS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [strokeCount, setStrokeCount] = useState(0);
  const drawing = useRef(false);

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL("image/png") || "",
  }));

  const redraw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = LINE_WIDTH;
    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      ctx.stroke();
    }
    const cur = currentRef.current;
    if (cur.length >= 2) {
      ctx.strokeStyle = colorRef.current;
      ctx.beginPath();
      ctx.moveTo(cur[0].x, cur[0].y);
      for (let i = 1; i < cur.length; i++) ctx.lineTo(cur[i].x, cur[i].y);
      ctx.stroke();
    }
  }, [width, height]);

  const getPos = (e: React.TouchEvent | React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  };

  const onStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    drawing.current = true;
    currentRef.current = [getPos(e)];
    redraw();
  };
  const onMove = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    currentRef.current.push(getPos(e));
    redraw();
  };
  const onEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    if (currentRef.current.length >= 2) {
      strokesRef.current = [...strokesRef.current, { points: currentRef.current, color: colorRef.current }];
      setStrokeCount(strokesRef.current.length);
      onStrokesChange?.(strokesRef.current);
    }
    currentRef.current = [];
    redraw();
  };

  const undo = () => {
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    onStrokesChange?.(strokesRef.current);
    redraw();
  };

  const clear = () => {
    strokesRef.current = [];
    currentRef.current = [];
    setStrokeCount(0);
    onStrokesChange?.([]);
    redraw();
  };

  const changeColor = (c: string) => {
    colorRef.current = c;
    setColor(c);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-2xl border-4 border-white/20"
        style={{ touchAction: "none", background: "#fff", width: "100%", maxWidth: width, aspectRatio: `${width}/${height}` }}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      />
      <div className="flex gap-3 items-center flex-wrap justify-center">
        {COLORS.map((c) => (
          <button key={c} className="rounded-full border-4 transition-transform"
            style={{ width: 48, height: 48, background: c, borderColor: color === c ? "#fff" : "transparent", transform: color === c ? "scale(1.2)" : "scale(1)" }}
            onClick={() => changeColor(c)}
            aria-label={`Color ${c}`}
          />
        ))}
        <button className="btn text-lg px-4 py-2" onClick={undo} disabled={strokeCount === 0}>↩️ Undo</button>
        <button className="btn text-lg px-4 py-2" onClick={clear} disabled={strokeCount === 0}>🗑️ Clear</button>
      </div>
    </div>
  );
});

export default Canvas;
