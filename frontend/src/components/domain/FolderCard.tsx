import { useTranslation } from 'react-i18next';
import { AccentIcon, ListCard } from '../ui';
import { FolderIcon } from '../icons';
import type { Folder } from '../../types';

export function FolderCard({ folder, setCount = 0, onPress, onLongPress, onMenuPress }: {
  folder: Folder;
  setCount?: number;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
}) {
  const { t } = useTranslation('library');
  const subtitle = t('library:folders.setsCount', { count: setCount, defaultValue: `${setCount} ${setCount === 1 ? 'set' : 'sets'}` });

  return (
    <ListCard
      leading={<AccentIcon icon={FolderIcon} color={folder.color} />}
      title={folder.name}
      subtitle={subtitle}
      onPress={onPress}
      onLongPress={onLongPress}
      onMenuPress={onMenuPress}
    />
  );
}
