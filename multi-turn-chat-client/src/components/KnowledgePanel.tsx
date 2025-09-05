import React from 'react';
import KnowledgePanelContainer from './knowledge/KnowledgePanelContainer';
import { KnowledgePanelProps } from './knowledge/KnowledgePanelTypes';

const KnowledgePanel: React.FC<KnowledgePanelProps> = (props) => {
  return <KnowledgePanelContainer {...props} />;
};

export default KnowledgePanel;