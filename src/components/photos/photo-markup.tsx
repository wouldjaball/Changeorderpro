"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Circle,
  Pen,
  Type,
  Undo2,
  Redo2,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = "arrow" | "circle" | "draw" | "text";

interface PhotoMarkupProps {
  imageUrl: string;
  onSave: (annotatedBlob: Blob) => void;
  onCancel: () => void;
}

export function PhotoMarkup({ imageUrl, onSave, onCancel }: PhotoMarkupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const [activeTool, setActiveTool] = useState<Tool>("draw");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [loaded, setLoaded] = useState(false);

  const saveHistory = useCallback(() => {
    if (!fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    // Remove future states if we're not at the end
    historyRef.current = historyRef.current.slice(
      0,
      historyIndexRef.current + 1
    );
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const fabric = await import("fabric");
      if (!mounted || !canvasRef.current) return;

      const canvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: 400,
        height: 400,
      });
      fabricRef.current = canvas;

      // Load background image
      const img = await fabric.FabricImage.fromURL(imageUrl);
      if (!mounted) return;

      // Scale image to fit canvas
      const scale = Math.min(400 / img.width!, 400 / img.height!);
      canvas.setDimensions({
        width: img.width! * scale,
        height: img.height! * scale,
      });
      canvas.backgroundImage = img;
      img.scaleX = scale;
      img.scaleY = scale;
      canvas.renderAll();

      // Set default drawing brush
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = "#ff0000";
      canvas.freeDrawingBrush.width = 3;

      // Save initial state
      saveHistory();
      setLoaded(true);

      // Track object modifications
      canvas.on("object:added", () => {
        if (mounted) saveHistory();
      });
      canvas.on("object:modified", () => {
        if (mounted) saveHistory();
      });
    }

    init();

    return () => {
      mounted = false;
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }
    };
  }, [imageUrl, saveHistory]);

  function selectTool(tool: Tool) {
    const canvas = fabricRef.current;
    if (!canvas) return;

    setActiveTool(tool);
    canvas.isDrawingMode = tool === "draw";

    if (tool === "draw") {
      import("fabric").then(({ PencilBrush }) => {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = "#ff0000";
        canvas.freeDrawingBrush.width = 3;
      });
    }
  }

  async function addArrow() {
    const fabric = await import("fabric");
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    setActiveTool("arrow");

    const line = new fabric.Line([50, 50, 200, 50], {
      stroke: "#ff0000",
      strokeWidth: 3,
      selectable: true,
    });

    // Arrow head
    const triangle = new fabric.Triangle({
      width: 15,
      height: 15,
      fill: "#ff0000",
      left: 200,
      top: 42,
      angle: 90,
      selectable: true,
    });

    const group = new fabric.Group([line, triangle], {
      selectable: true,
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
  }

  async function addCircle() {
    const fabric = await import("fabric");
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    setActiveTool("circle");

    const circle = new fabric.Circle({
      radius: 40,
      fill: "transparent",
      stroke: "#ff0000",
      strokeWidth: 3,
      left: canvas.width! / 2 - 40,
      top: canvas.height! / 2 - 40,
      selectable: true,
    });

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  }

  async function addText() {
    const fabric = await import("fabric");
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    setActiveTool("text");

    const text = new fabric.IText("Label", {
      left: canvas.width! / 2 - 30,
      top: canvas.height! / 2 - 10,
      fontSize: 18,
      fill: "#ff0000",
      fontFamily: "sans-serif",
      fontWeight: "bold",
      selectable: true,
      editable: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }

  function undo() {
    if (historyIndexRef.current <= 0 || !fabricRef.current) return;
    historyIndexRef.current--;
    const json = historyRef.current[historyIndexRef.current];
    fabricRef.current.loadFromJSON(json).then(() => {
      fabricRef.current.renderAll();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }

  function redo() {
    if (
      historyIndexRef.current >= historyRef.current.length - 1 ||
      !fabricRef.current
    )
      return;
    historyIndexRef.current++;
    const json = historyRef.current[historyIndexRef.current];
    fabricRef.current.loadFromJSON(json).then(() => {
      fabricRef.current.renderAll();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }

  function handleSave() {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Deselect all objects to remove selection handles
    canvas.discardActiveObject();
    canvas.renderAll();

    // Export as PNG blob
    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 0.9,
      multiplier: 2,
    });

    // Convert data URL to blob
    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    onSave(blob);
  }

  const tools = [
    { id: "draw" as Tool, icon: Pen, label: "Draw", action: () => selectTool("draw") },
    { id: "arrow" as Tool, icon: ArrowUpRight, label: "Arrow", action: addArrow },
    { id: "circle" as Tool, icon: Circle, label: "Circle", action: addCircle },
    { id: "text" as Tool, icon: Type, label: "Text", action: addText },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.id}
              type="button"
              variant={activeTool === tool.id ? "default" : "outline"}
              size="sm"
              onClick={tool.action}
              className="gap-1"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs">{tool.label}</span>
            </Button>
          );
        })}
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={undo}
          disabled={!canUndo}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={redo}
          disabled={!canRedo}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="border rounded-lg overflow-hidden bg-muted/50">
        <canvas ref={canvasRef} />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleSave}
          disabled={!loaded}
        >
          <Check className="mr-2 h-4 w-4" />
          Save Markup
        </Button>
      </div>
    </div>
  );
}
