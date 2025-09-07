import React, { useEffect } from 'react';
import type { AddDocumentModalProps } from './types';
import { useAddDocumentLogic } from './useAddDocumentLogic';
import { ModalHeader } from './Header';
import { ModalFooter } from './Footer';
import { AddDocumentForm } from './Form';

const AddDocumentModal: React.FC<AddDocumentModalProps> = (props) => {
  const {
    categories,
    contentTextareaRef,
    formData,
    errors,
    saving,
    gen,
    handleInputChange,
    setContentAndScroll,
    handleSave,
    handleGenerate,
  } = useAddDocumentLogic(props);

  const { visible, onClose } = props;

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [visible, onClose, handleSave]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        <ModalHeader title="新增文档" onClose={onClose} disabled={saving || gen.generating} />

        <AddDocumentForm
          formData={formData}
          errors={errors}
          categories={categories}
          onChange={(field, value) => {
            if (field === 'content') {
              setContentAndScroll(String(value));
            } else {
              handleInputChange(field, value);
            }
          }}
          onGenerate={(t) => handleGenerate(t)}
          gen={gen}
          contentRef={contentTextareaRef}
        />

        <ModalFooter onCancel={onClose} onSave={handleSave} disabled={saving || gen.generating} saving={saving} />
      </div>
    </div>
  );
};

export default AddDocumentModal;