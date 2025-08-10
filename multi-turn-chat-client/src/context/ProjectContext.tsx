import React, { createContext, useContext, PropsWithChildren, useMemo } from 'react';
import { Project } from '../types';
type ProjectContextValue = {
  projects: Project[];
  currentProjectId?: number;
  getCurrentProject: () => Project | undefined;
  getAiWorkDir: () => string | undefined;
};
const ProjectContext = createContext<ProjectContextValue>({
  projects: [],
  currentProjectId: undefined,
  getCurrentProject: () => undefined,
  getAiWorkDir: () => undefined,
});
export function ProjectProvider({
  projects,
  currentProjectId,
  children,
}: PropsWithChildren<{ projects: Project[]; currentProjectId?: number }>) {
  const value = useMemo<ProjectContextValue>(() => {
    const getCurrentProject = () => {
      if (typeof currentProjectId !== 'number') return undefined;
      return projects.find((p) => p.id === currentProjectId);
    };
    const getAiWorkDir = () => {
      const p = getCurrentProject();
      return p?.ai_work_dir || p?.aiWorkDir || undefined;
    };
    return { projects, currentProjectId, getCurrentProject, getAiWorkDir };
  }, [projects, currentProjectId]);
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
export function useProject() {
  return useContext(ProjectContext);
}