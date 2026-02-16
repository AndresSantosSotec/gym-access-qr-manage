import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, Plus, PaintBrush } from '@phosphor-icons/react';
import { useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  { name: 'Violeta', hex: '#7C3AED' },
  { name: 'Púrpura', hex: '#8B5CF6' },
  { name: 'Azul Marino', hex: '#1E40AF' },
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Turquesa', hex: '#14B8A6' },
  { name: 'Verde', hex: '#10B981' },
  { name: 'Lima', hex: '#84CC16' },
  { name: 'Amarillo', hex: '#F59E0B' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Rojo', hex: '#EF4444' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Gris Oscuro', hex: '#1f2937' },
  { name: 'Negro', hex: '#000000' },
  { name: 'Blanco', hex: '#ffffff' },
];

export function ColorPicker({ value, onChange, label = 'Color Principal' }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onChange(color);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full border shadow-sm"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs text-muted-foreground uppercase">{value}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => onChange(color.hex)}
            className={`relative w-8 h-8 rounded-full transition-all border ${value === color.hex
                ? 'ring-2 ring-primary ring-offset-2 scale-110'
                : 'hover:scale-110'
              }`}
            title={color.name}
            style={{ backgroundColor: color.hex }}
          >
            {value === color.hex && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check size={14} weight="bold" className={`drop-shadow-sm ${['#ffffff', '#f59e0b', '#84cc16'].includes(color.hex) ? 'text-black' : 'text-white'}`} />
              </div>
            )}
          </button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="w-8 h-8 rounded-full p-0 border-dashed border-2 hover:border-solid">
              <Plus size={14} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="space-y-3">
              <Label>Color Personalizado</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={customColor}
                  onChange={handleCustomChange}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    onChange(e.target.value);
                  }}
                  placeholder="#000000"
                  className="flex-1 uppercase"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}