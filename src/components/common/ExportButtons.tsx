import { Button, Group } from '@mantine/core';
import { IconFileSpreadsheet, IconFileTypePdf } from '@tabler/icons-react';

interface Props {
  onExcel: () => void;
  onPdf: () => void;
  disabled?: boolean;
}

export function ExportButtons({ onExcel, onPdf, disabled }: Props) {
  return (
    <Group gap="xs" wrap="nowrap">
      <Button
        variant="default"
        size="sm"
        leftSection={<IconFileSpreadsheet size={16} />}
        onClick={onExcel}
        disabled={disabled}
      >
        Excel
      </Button>
      <Button
        variant="default"
        size="sm"
        leftSection={<IconFileTypePdf size={16} />}
        onClick={onPdf}
        disabled={disabled}
      >
        PDF
      </Button>
    </Group>
  );
}
