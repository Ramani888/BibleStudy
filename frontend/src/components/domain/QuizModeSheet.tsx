import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { QMSheet, type QMSheetAction } from '../qm';
import {
  BlanksIcon, ChoiceIcon, MatchIcon, OrderIcon, ReadIcon, ShuffleIcon, TypeAnswerIcon, TypeOutIcon, type IconComponent,
} from '../icons';
import { useCards } from '../../hooks';
import { MODE_META, MIN_MC_CARDS } from '../../hooks/useQuizSession';
import type { QuizMode, QuizSelectableMode } from '../../types';

interface QuizModeSheetProps {
  visible: boolean;
  setIds: string[];
  setTitles: string[];
  onClose: () => void;
  onStart: (mode: QuizSelectableMode, setIds: string[], setTitles: string[]) => void;
}

const MODE_ICON: Record<QuizMode, IconComponent> = {
  type_answer: TypeAnswerIcon, mc: ChoiceIcon, blanks: BlanksIcon, type_verbatim: TypeOutIcon,
  chunks: OrderIcon, read: ReadIcon, story_mc: MatchIcon,
};

/** Quiz-type picker. Mirrors `supportedModes()`; the 4+-card modes show greyed with the reason. */
export function QuizModeSheet({ visible, setIds, setTitles, onClose, onStart }: QuizModeSheetProps) {
  const { t } = useTranslation(['quiz', 'library']);
  const { data: cards = [] } = useCards(setIds[0] ?? '');

  const actions = useMemo<QMSheetAction[]>(() => {
    if (!cards.length) return [];
    const qa = cards.filter(c => c.type === 'QA').length;
    const story = cards.length - qa;
    const start = (m: QuizSelectableMode) => () => onStart(m, setIds, setTitles);
    const mode = (m: QuizMode, need?: string): QMSheetAction => ({
      label: t(`quiz:modes.${m}`, MODE_META[m].label),
      icon: MODE_ICON[m],
      sub: need ?? (MODE_META[m].scored ? undefined : t('library:qm.practiceNotScored', 'Practice, not scored')),
      off: !!need,
      onPress: start(m),
    });
    const rows: QMSheetAction[] = [
      { label: t('quiz:setup.modeMix', 'Mix'), sub: t('library:qm.mixDesc', 'A random mix of all types'), icon: ShuffleIcon, highlight: true, onPress: start('mix') },
    ];
    if (qa > 0) {
      rows.push(mode('type_answer'));
      rows.push(mode('mc', qa >= MIN_MC_CARDS ? undefined : t('library:qm.needsQA', { count: MIN_MC_CARDS, defaultValue: `Needs ${MIN_MC_CARDS}+ Q&A cards` })));
    }
    if (story > 0) {
      rows.push(mode('blanks'), mode('type_verbatim'), mode('chunks'), mode('read'));
      rows.push(mode('story_mc', story >= MIN_MC_CARDS ? undefined : t('library:qm.needsStory', { count: MIN_MC_CARDS, defaultValue: `Needs ${MIN_MC_CARDS}+ story cards` })));
    }
    return rows;
  }, [cards, setIds, setTitles, onStart, t]);

  return (
    <QMSheet
      visible={visible}
      onClose={onClose}
      title={t('library:qm.chooseQuiz', 'Choose a quiz')}
      sub={setTitles[0]}
      actions={actions}
      note={cards.length ? undefined : t('quiz:setup.addCardsToQuiz', 'Add cards to this set to start quizzing.')}
    />
  );
}
