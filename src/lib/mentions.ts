import { Profile } from '@/hooks/useProfiles';

// Extract mentioned user IDs from a note text
// Mentions are in the format @DisplayName
export function extractMentionedUsers(note: string, profiles: Profile[]): Profile[] {
  const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)?)/g;
  const mentions: Profile[] = [];
  let match;

  while ((match = mentionRegex.exec(note)) !== null) {
    const mentionText = match[1];
    // Find a profile that matches this mention
    const profile = profiles.find(
      (p) =>
        p.display_name?.toLowerCase() === mentionText.toLowerCase() ||
        p.email?.split('@')[0].toLowerCase() === mentionText.toLowerCase()
    );
    if (profile && !mentions.some((m) => m.id === profile.id)) {
      mentions.push(profile);
    }
  }

  return mentions;
}
