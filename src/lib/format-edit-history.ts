import type { EditEvent } from "@/types/canvas";

export function formatEditHistory(events: EditEvent[]): string {
  return events
    .map((e) => {
      switch (e.type) {
        case "label_changed":
          return `Changed label of "${e.from}" to "${e.to}"`;
        case "description_changed":
          return `Updated description of node ${e.nodeId}`;
        case "type_changed":
          return `Changed type of node ${e.nodeId} from ${e.from} to ${e.to}`;
        case "node_deleted":
          return `Deleted node "${e.label}"`;
        case "node_created":
          return `Added a new node`;
        case "edge_created":
          return `Connected ${e.source} to ${e.target}`;
        case "edge_deleted":
          return `Removed connection from ${e.source} to ${e.target}`;
        case "edge_label_changed":
          return e.from
            ? `Changed edge label from "${e.from}" to "${e.to}"`
            : `Added edge label "${e.to}"`;
      }
    })
    .join("\n");
}
