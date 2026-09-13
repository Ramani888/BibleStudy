import { Linking, Share } from 'react-native';
import type { Visibility } from '../types/common.types';

const SITE = 'https://getverdance.com';

// PUBLIC sets get a live per-set landing page (getverdance.com/s.html?id=…) that
// shows a card teaser + install CTA. Non-public sets fall back to the homepage —
// the share message still carries the cards as text, the link just can't preview them.
export function buildSetShareLink(set: { id: string; visibility: Visibility }): string {
  return set.visibility === 'PUBLIC' ? `${SITE}/s.html?id=${set.id}` : `${SITE}/`;
}

// Open WhatsApp directly with the message pre-filled. wa.me is a universal link —
// opens the app if installed, else WhatsApp web — and needs no Info.plist scheme.
// Falls back to the system share sheet if WhatsApp can't be opened.
export async function shareToWhatsApp(message: string): Promise<void> {
  try {
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
  } catch {
    try { await Share.share({ message }); } catch { /* user cancelled */ }
  }
}
