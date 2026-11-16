'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdjustId } from '@/lib/adjust';
import { adjustStory, createStory, fetchStatus } from '@/lib/client/api';
import { deleteStory, giveConsent, hasConsented, listStories, saveStory, storageWorks } from '@/lib/client/storage';
import { track } from '@/lib/client/track';
import type { ApiResult, SavedStory } from '@/lib/client/types';
import type { Animal, Hero } from '@/lib/hero';
import type { Brief, Story } from '@/lib/schema';
import { companionFor } from './Art';
import { BriefScreen, EMPTY_BRIEF, type BriefInput } from './screens/Brief';
import { Making } from './screens/Making';
import { Library, NoticeScreen, ParentArea, type NoticeAction } from './screens/Parent';
import { Goodnight, Reader } from './screens/Reader';
import { Review } from './screens/Review';
import { Welcome, type Path } from './screens/Welcome';
import { Sheet } from './ui';

type Screen = 'welcome' | 'brief' | 'making' | 'review' | 'reader' | 'goodnight' | 'parent' | 'library' | 'notice';

interface Draft {
  brief: Brief;
  hero: Hero;
  story: Story;
  prev: Story | null;
  companion: Animal | null;
  savedId?: string;
}

interface Pending {
  brief: Brief;
  hero: Hero;
  kind: 'first' | 'regen';
}

interface NoticeState {
  title: string;
  message: string;
  actions: NoticeAction[];
}

export function App() {
  const [ready, setReady] = useState(false);
  const [consented, setConsented] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [demo, setDemo] = useState(false);
  const [paused, setPaused] = useState(false);
  const [saved, setSaved] = useState<SavedStory[]>([]);

  const [screen, setScreen] = useState<Screen>('welcome');
  const [path, setPath] = useState<Path>('moment');
  const [input, setInput] = useState<BriefInput>(EMPTY_BRIEF);
  const [pending, setPending] = useState<Pending | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [info, setInfo] = useState(false);
  const [readerKey, setReaderKey] = useState(0);

  const startedAt = useRef(0);
  const edited = useRef(false);
  const feedbackSent = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const toastTimer = useRef<number | null>(null);

  const refreshSaved = useCallback(() => {
    setSaved(listStories());
    setStorageOk(storageWorks());
  }, []);

  useEffect(() => {
    setConsented(hasConsented());
    refreshSaved();
    setReady(true);
    track('app_opened');
    void fetchStatus().then((s) => {
      setDemo(s.demo);
      setPaused(s.paused);
    });
  }, [refreshSaved]);

  useEffect(() => {
    document.body.dataset.mode = screen === 'reader' || screen === 'goodnight' ? 'night' : 'day';
    window.scrollTo({ top: 0 });
  }, [screen]);

  const say = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const goHome = useCallback(() => {
    abort.current?.abort();
    setDraft(null);
    setNotice(null);
    setBusy(null);
    setScreen('welcome');
    refreshSaved();
  }, [refreshSaved]);

  const secondsSinceStart = () => Math.round((Date.now() - startedAt.current) / 1000);

  /* ---------- Making a story ---------- */

  const generate = useCallback(
    async (brief: Brief, hero: Hero, kind: 'first' | 'regen') => {
      abort.current?.abort();
      const ac = new AbortController();
      abort.current = ac;
      setPending({ brief, hero, kind });
      setScreen('making');

      const res: ApiResult = await createStory(brief, ac.signal);
      if (ac.signal.aborted) return;

      if (res.kind === 'ok') {
        setDemo(res.demo);
        setDraft((d) => ({
          brief,
          hero,
          story: res.story,
          prev: kind === 'regen' ? d?.story ?? null : null,
          companion: companionFor(res.story) ?? (kind === 'regen' ? d?.companion ?? null : null),
        }));
        edited.current = false;
        track('story_generated', { ms: res.ms, attempts: res.attempts, tier: res.story.safety.tier, demo: res.demo });
        if (kind === 'regen') track('regenerate_used');
        if (res.story.facts_added.length > 0) track('added_details_shown');
        setScreen('review');
        return;
      }

      const backToBrief = () => setScreen('brief');
      const again = () => void generate(brief, hero, kind);

      if (res.kind === 'declined') {
        track('tier_declined');
        setNotice({
          title: 'Let’s keep this one for a cuddle',
          message: res.message,
          actions: [{ label: 'Start a different story', primary: true, onClick: goHome }],
        });
        setScreen('notice');
        return;
      }

      if (kind === 'regen' && res.code !== 'cap_reached' && res.code !== 'paused') {
        track('generation_failed', { code: res.code });
        say('We could not make a new draft. Your story is unchanged.');
        setScreen('review');
        return;
      }

      if (res.code === 'cap_reached') {
        track('cap_reached');
        setNotice({ title: 'That is enough stories for today', message: 'Please come back tomorrow. Your saved stories are still here to read.', actions: [{ label: 'Back to the start', primary: true, onClick: goHome }] });
      } else if (res.code === 'paused') {
        track('cap_reached', { scope: 'paused' });
        setNotice({ title: 'The beta is paused', message: 'Thank you for trying Tiny Tales. We have paused new stories for now. Please check back soon.', actions: [{ label: 'Back to the start', primary: true, onClick: goHome }] });
      } else if (res.code === 'draft_blocked') {
        track('moderation_blocked', { where: 'output' });
        setNotice({
          title: 'That draft did not pass our checks',
          message: 'We threw it away so you do not have to read it. Please try again, or change the words you gave us.',
          actions: [
            { label: 'Try again', primary: true, onClick: again },
            { label: 'Back to my answers', onClick: backToBrief },
          ],
        });
      } else {
        track('generation_failed', { code: res.code });
        setNotice({
          title: 'We could not write that story',
          message: res.code === 'network' ? 'It looks like the connection dropped. Your answers are kept.' : 'Something went wrong on our side. Your answers are kept.',
          actions: [
            { label: 'Try again', primary: true, onClick: again },
            { label: 'Back to my answers', onClick: backToBrief },
          ],
        });
      }
      setScreen('notice');
    },
    [goHome, say],
  );

  /* ---------- Handlers ---------- */

  const start = (p: Path) => {
    setPath(p);
    setInput(EMPTY_BRIEF);
    startedAt.current = Date.now();
    feedbackSent.current = false;
    track('brief_started', { path: p });
    setScreen('brief');
  };

  const submitBrief = (brief: Brief, i: BriefInput) => {
    setInput(i);
    track('brief_submitted', { path, seconds: secondsSinceStart() });
    void generate(brief, i.hero, 'first');
  };

  const editStory = (next: Story) => {
    setDraft((d) => (d ? { ...d, story: next } : d));
    if (!edited.current) {
      edited.current = true;
      track('edit_used');
    }
  };

  const adjust = async (id: AdjustId) => {
    if (!draft || busy) return;
    const ac = new AbortController();
    abort.current = ac;
    setBusy('Rewriting the story…');
    const res = await adjustStory(draft.brief, draft.story, id, ac.signal);
    setBusy(null);
    if (ac.signal.aborted) return;
    if (res.kind === 'ok') {
      setDraft((d) => (d ? { ...d, prev: d.story, story: res.story, companion: companionFor(res.story) ?? d.companion } : d));
      track('adjustment_used', { kind: id });
    } else if (res.kind === 'declined') {
      say('That change was not possible. Your story is unchanged.');
    } else if (res.code === 'cap_reached') {
      track('cap_reached', { scope: 'adjust' });
      say('That is enough changes for today. You can still edit the words yourself.');
    } else {
      track('generation_failed', { code: res.code, where: 'adjust' });
      say('That change did not work. Your story is unchanged.');
    }
  };

  const undo = () => {
    setDraft((d) => (d?.prev ? { ...d, story: d.prev, prev: null } : d));
    track('undo_used');
  };

  const approve = () => {
    track('story_approved', { seconds: secondsSinceStart() });
    track('reader_opened', { from: 'review' });
    setReaderKey((k) => k + 1);
    setScreen('reader');
  };

  const sendFeedback = (rating: number | null, answer: string) => {
    if (feedbackSent.current || (rating === null && !answer)) return;
    feedbackSent.current = true;
    track('feedback_submitted', { rating: rating ?? 0, ...(answer ? { answer } : {}) });
  };

  const saveCurrent = (rating: number | null, answer: string) => {
    if (!draft) return;
    sendFeedback(rating, answer);
    const item = saveStory({ id: draft.savedId, brief: draft.brief, hero: draft.hero, story: draft.story, ...(rating ? { rating } : {}) });
    setDraft({ ...draft, savedId: item.id });
    track('story_saved');
    refreshSaved();
  };

  const openSaved = (s: SavedStory) => {
    setDraft({ brief: s.brief, hero: s.hero, story: s.story, prev: null, companion: companionFor(s.story), savedId: s.id });
    track('reader_opened', { from: 'library' });
    setReaderKey((k) => k + 1);
    setScreen('reader');
  };

  /* ---------- Rendering ---------- */

  if (!ready) return <main className="shell" aria-busy="true" />;

  const readerView =
    draft && screen === 'reader' ? (
      <Reader
        key={readerKey}
        brief={draft.brief}
        hero={draft.hero}
        story={draft.story}
        companion={draft.companion}
        onFinish={() => {
          track('story_completed');
          setScreen('goodnight');
        }}
        onParent={() => {
          track('parent_gate_used');
          setScreen('parent');
        }}
      />
    ) : draft && screen === 'goodnight' ? (
      <Goodnight
        brief={draft.brief}
        story={draft.story}
        onParent={() => {
          track('parent_gate_used');
          setScreen('parent');
        }}
      />
    ) : null;

  if (readerView) return readerView;

  return (
    <main className="shell">
      {screen === 'welcome' && (
        <Welcome
          demo={demo}
          paused={paused}
          consented={consented}
          storageOk={storageOk}
          savedCount={saved.length}
          onConsent={() => {
            giveConsent();
            setConsented(true);
          }}
          onStart={start}
          onLibrary={() => {
            refreshSaved();
            setScreen('library');
          }}
        />
      )}

      {screen === 'brief' && <BriefScreen key={`brief-${startedAt.current}`} path={path} initial={input} onBack={goHome} onInfo={() => setInfo(true)} onSubmit={submitBrief} />}

      {screen === 'making' && pending && (
        <Making
          brief={pending.brief}
          hero={pending.hero}
          onCancel={() => {
            abort.current?.abort();
            setScreen(pending.kind === 'regen' && draft ? 'review' : 'brief');
          }}
          onRetry={() => void generate(pending.brief, pending.hero, pending.kind)}
        />
      )}

      {screen === 'review' && draft && (
        <Review
          brief={draft.brief}
          hero={draft.hero}
          story={draft.story}
          companion={draft.companion}
          demo={demo}
          canUndo={!!draft.prev}
          busy={busy}
          message={toast}
          onEdit={editStory}
          onAdjust={(id) => void adjust(id)}
          onRegenerate={() => void generate(draft.brief, draft.hero, 'regen')}
          onUndo={undo}
          onApprove={approve}
          onBack={() => setScreen('brief')}
        />
      )}

      {screen === 'parent' && draft && (
        <ParentArea
          brief={draft.brief}
          story={draft.story}
          saved={!!draft.savedId}
          storageOk={storageOk}
          onTalkViewed={() => track('talk_prompts_viewed')}
          onSave={saveCurrent}
          onReadAgain={(r, a) => {
            sendFeedback(r, a);
            track('reader_opened', { from: 'parent' });
            setReaderKey((k) => k + 1);
            setScreen('reader');
          }}
          onEdit={(r, a) => {
            sendFeedback(r, a);
            setScreen('review');
          }}
          onNew={(r, a) => {
            sendFeedback(r, a);
            goHome();
          }}
        />
      )}

      {screen === 'library' && (
        <Library
          stories={saved}
          onBack={goHome}
          onOpen={openSaved}
          onDelete={(id) => {
            deleteStory(id);
            refreshSaved();
          }}
        />
      )}

      {screen === 'notice' && notice && <NoticeScreen title={notice.title} message={notice.message} actions={notice.actions} />}

      <Sheet open={info} onClose={() => setInfo(false)} title="How this works">
        <ul className="bullets">
          <li>An AI writes the story from what you tell us. It can get things wrong, so you read it first and can change any word.</li>
          <li>Nothing reaches your child until you approve it.</li>
          <li>We send only the first name, the age and the words you type. Please leave out surnames, addresses and schools.</li>
          <li>Stories are saved on this device only, and you can delete them at any time.</li>
        </ul>
        <button className="btn btn-primary btn-block" onClick={() => setInfo(false)}>
          Got it
        </button>
      </Sheet>
    </main>
  );
}
