// components/ModelSelect.tsx
import { FC } from 'react';
import { MODELS, ModelId, getModelConfig } from '@/types/model';

interface Props {
  model: ModelId;
  onChange: (model: ModelId) => void;
}

export const ModelSelect: FC<Props> = ({ model, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as ModelId);
  };

  return (
    <select
      className="h-[40px] w-[220px] rounded-md bg-[#1F2937] px-4 py-2 text-neutral-200"
      value={model}
      onChange={handleChange}
    >
      {MODELS.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label} ({m.provider})
        </option>
      ))}
    </select>
  );
};