/**
 * Workflow Loader
 * Loads workflow JSON files from the public directory
 */

import { getWorkflowDefinition, getAllWorkflows } from "./workflow-definitions";

export interface WorkflowData {
  [nodeId: string]: {
    inputs: Record<string, unknown>;
    class_type: string;
  };
}

export class WorkflowLoader {
  private cache: Map<string, WorkflowData> = new Map();

  async load(workflowId: string): Promise<WorkflowData> {
    if (this.cache.has(workflowId)) {
      return this.cache.get(workflowId)!;
    }

    const definition = getWorkflowDefinition(workflowId);
    if (!definition) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    try {
      const response = await fetch(`/workflows/${definition.filePath.split('/').pop()}`);
      if (!response.ok) {
        throw new Error(`Failed to load workflow: ${response.statusText}`);
      }

      const workflowData = await response.json();

      this.cache.set(workflowId, workflowData);

      return workflowData;
    } catch (error) {
      console.error(`Failed to load workflow ${workflowId}:`, error);
      throw error;
    }
  }

  async loadMultiple(workflowIds: string[]): Promise<Map<string, WorkflowData>> {
    const results = new Map<string, WorkflowData>();

    for (const workflowId of workflowIds) {
      try {
        const data = await this.load(workflowId);
        results.set(workflowId, data);
      } catch (error) {
        console.warn(`Failed to load workflow ${workflowId}:`, error);
      }
    }

    return results;
  }
}

export { getWorkflowDefinition, getAllWorkflows };

export const workflowLoader = new WorkflowLoader();
