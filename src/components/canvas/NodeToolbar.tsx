"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCanvasStore } from "@/stores/canvas-store";

interface NodeToolbarProps {
  nodeId: string;
}

export function NodeToolbar({ nodeId }: NodeToolbarProps) {
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    const result = useCanvasStore.getState().deleteNode(nodeId);
    if (result) {
      toast("Node deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            useCanvasStore.getState().restoreNode(result.node, result.edges);
          },
        },
        duration: 3000,
      });
    }
  }

  return (
    <div className="pointer-events-auto flex items-center gap-1">
      <button
        onClick={handleDelete}
        className="rounded-sm p-1 text-text-muted transition-colors hover:bg-red-500/20 hover:text-red-400"
        aria-label="Delete node"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
