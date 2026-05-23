export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  deals: any[];
}

export interface PipelineData {
  stages: PipelineStage[];
}
