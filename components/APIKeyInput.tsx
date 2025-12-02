import { Icon2fa } from '@tabler/icons-react';
import { FC } from 'react';

interface Props {
  apiKey: string;
  onChange: (apiKey: string) => void;
}

export const APIKeyInput: FC<Props> = ({ apiKey, onChange }) => {
  return (
    <div className="relative">
      <Icon2fa className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
      <input
        className="w-full rounded-lg border border-neutral-600 bg-[#15161A] py-2 pl-10 pr-12 text-neutral-200 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        type="password"
        value={apiKey}
        onChange={(e) => onChange(e.target.value)}
        placeholder="API Key"
      />
    </div>
  );
};