"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart2,
  Bold,
  Clock,
  FileText,
  Hash,
  Italic,
  List,
  LogOut,
  Pencil,
  PlusCircle,
  Search,
  Settings,
  Sparkles,
  StickyNote,
  TagIcon,
  Trash2,
  TrendingDown,
  TrendingUp,
  Archive,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
};

type View = "notes" | "tags" | "archive" | "statistics" | "settings";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Tiptap Toolbar ───────────────────────────────────────────────────────────

function MenuBar({ editor }: { editor: any }) {
  if (!editor) return null;
  return (
    <div className="mb-2 flex gap-0.5 border-b border-black/[0.06] pb-2">
      <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()} className="h-7 w-7 rounded-md">
        <Bold className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()} className="h-7 w-7 rounded-md">
        <Italic className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} className="h-7 w-7 rounded-md">
        <List className="h-3.5 w-3.5" />
      </Toggle>
    </div>
  );
}

// ─── KPI Stat Card ────────────────────────────────────────────────────────────

type StatColor = "violet" | "peach" | "sky" | "mint";

const STAT_COLORS: Record<StatColor, {
  bg: string; pillBg: string; pillText: string; valueBg: string; valueText: string; trendText: string;
}> = {
  violet: { bg: "bg-[#EEE8FF]", pillBg: "bg-[#7C5CFE]/10", pillText: "text-[#7C5CFE]", valueBg: "bg-[#7C5CFE]/10", valueText: "text-[#7C5CFE]", trendText: "text-[#7C5CFE]" },
  peach:  { bg: "bg-[#FFF0E6]", pillBg: "bg-[#FF6B35]/10",  pillText: "text-[#FF6B35]",  valueBg: "bg-[#FF6B35]/10",  valueText: "text-[#FF6B35]",  trendText: "text-[#FF6B35]"  },
  sky:    { bg: "bg-[#E6F4FF]", pillBg: "bg-[#3B97FF]/10",  pillText: "text-[#3B97FF]",  valueBg: "bg-[#3B97FF]/10",  valueText: "text-[#3B97FF]",  trendText: "text-[#3B97FF]"  },
  mint:   { bg: "bg-[#E6FAF0]", pillBg: "bg-[#1DAF6E]/10",  pillText: "text-[#1DAF6E]",  valueBg: "bg-[#1DAF6E]/10",  valueText: "text-[#1DAF6E]",  trendText: "text-[#1DAF6E]"  },
};

function StatCard({ icon: Icon, category, title, value, sublabel, trend, trendUp, color }: {
  icon: React.ElementType; category: string; title: string; value: number;
  sublabel: string; trend?: string; trendUp?: boolean; color: StatColor;
}) {
  const c = STAT_COLORS[color];
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;
  return (
    <div className={cn("flex flex-col rounded-2xl p-5", c.bg)}>
      {/* Top row — category pill + value badge */}
      <div className="mb-4 flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", c.pillBg, c.pillText)}>
          <Icon className="h-3 w-3" />{category}
        </span>
        <span className={cn("rounded-full px-2.5 py-1 text-[13px] font-bold tabular-nums", c.valueBg, c.valueText)}>
          {value}
        </span>
      </div>

      {/* Title — the "course name" equivalent */}
      <p className="mb-1 text-[15px] font-bold leading-snug tracking-tight text-[#111110]">{title}</p>

      {/* Bottom — sublabel + trend */}
      <div className="mt-auto flex items-center justify-between pt-3">
        <p className="text-[11px] text-black/38">{sublabel}</p>
        {trend && (
          <div className={cn("flex items-center gap-1 text-[11px] font-semibold", c.trendText)}>
            <TrendIcon className="h-3 w-3" />{trend}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Recent Note Card ─────────────────────────────────────────────────────────

function RecentNoteCard({ note, onEdit }: { note: Note; onEdit: (note: Note) => void }) {
  const initials = note.title.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white p-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-[11px] font-bold text-black/45">{initials}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-snug text-[#111110]">{note.title}</p>
        <p className="mt-0.5 text-[11px] text-black/35">{note.tags[0] ?? "—"}&ensp;·&ensp;{formatDate(note.createdAt)}</p>
      </div>
      <button onClick={() => onEdit(note)} className="shrink-0 rounded-full bg-[#111110] px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-70">
        Edit
      </button>
    </div>
  );
}

// ─── Note Grid Card ───────────────────────────────────────────────────────────

function NoteCard({ note, onEdit, onDelete }: {
  note: Note; onEdit: (note: Note) => void; onDelete: (id: string) => void;
}) {
  const preview = stripHtml(note.content);
  return (
    <div className="group relative flex flex-col rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.10)]">
      <div className="mb-3 flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-black/25">{formatDate(note.createdAt)}</span>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button onClick={() => onEdit(note)} className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:bg-black/6">
            <Pencil className="h-3 w-3 text-black/35" />
          </button>
          <button onClick={() => onDelete(note.id)} className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:bg-red-50">
            <Trash2 className="h-3 w-3 text-black/25 hover:text-red-400" />
          </button>
        </div>
      </div>
      <h3 className="mb-2 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-[#111110]">{note.title}</h3>
      <p className="mb-4 flex-1 line-clamp-3 text-xs leading-relaxed text-black/38">{preview || "—"}</p>
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-black/38">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Item ─────────────────────────────────────────────────────────────

function SidebarItem({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
        active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/90",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  );
}

// ─── View: Tags ───────────────────────────────────────────────────────────────

function TagsView({ notes, onFilterSelect }: { notes: Note[]; onFilterSelect: (tag: string) => void }) {
  const tagData = useMemo(() => {
    const map = new Map<string, Note[]>();
    notes.forEach((note) => note.tags.forEach((tag) => {
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag)!.push(note);
    }));
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [notes]);

  if (tagData.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.04]">
          <Hash className="h-6 w-6 text-black/15" />
        </div>
        <p className="text-sm font-semibold text-black/25">No tags yet</p>
        <p className="text-xs text-black/20">Add tags to your notes to see them here</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mb-6">
        <h2 className="text-[20px] font-bold tracking-tight text-[#111110]">Tags</h2>
        <p className="mt-1 text-[13px] text-black/38">{tagData.length} unique {tagData.length === 1 ? "tag" : "tags"} across {notes.length} notes</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tagData.map(([tag, tagNotes]) => (
          <div key={tag} className="flex flex-col rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/[0.04]">
                  <Hash className="h-3.5 w-3.5 text-black/35" />
                </div>
                <span className="text-[14px] font-semibold text-[#111110]">{tag}</span>
              </div>
              <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] font-semibold text-black/40">
                {tagNotes.length} {tagNotes.length === 1 ? "note" : "notes"}
              </span>
            </div>
            <div className="mb-4 flex flex-col gap-1.5">
              {tagNotes.slice(0, 3).map((note) => (
                <p key={note.id} className="truncate text-[12px] text-black/45">· {note.title}</p>
              ))}
              {tagNotes.length > 3 && (
                <p className="text-[11px] text-black/25">+{tagNotes.length - 3} more</p>
              )}
            </div>
            <button
              onClick={() => onFilterSelect(tag)}
              className="mt-auto w-full rounded-full border border-black/10 py-1.5 text-[12px] font-medium text-black/50 transition-all hover:border-black/20 hover:bg-black/[0.02] hover:text-black/70"
            >
              View notes
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── View: Statistics ─────────────────────────────────────────────────────────

function StatisticsView({ notes }: { notes: Note[] }) {
  const tagData = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((n) => n.tags.forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  const maxTagCount = tagData[0]?.[1] ?? 1;

  const thisWeek = useMemo(() => {
    const ago = new Date(); ago.setDate(ago.getDate() - 7);
    return notes.filter((n) => n.createdAt >= ago).length;
  }, [notes]);

  const thisMonth = useMemo(() => {
    const ago = new Date(); ago.setDate(ago.getDate() - 30);
    return notes.filter((n) => n.createdAt >= ago).length;
  }, [notes]);

  const taggedCount = notes.filter((n) => n.tags.length > 0).length;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mb-6">
        <h2 className="text-[20px] font-bold tracking-tight text-[#111110]">Statistics</h2>
        <p className="mt-1 text-[13px] text-black/38">An overview of your notes workspace</p>
      </div>

      {/* Top KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total notes", value: notes.length, color: "bg-[#FFF8E7]", text: "text-amber-600" },
          { label: "Tagged notes", value: taggedCount, color: "bg-[#F0FAF5]", text: "text-emerald-600" },
          { label: "This week", value: thisWeek, color: "bg-[#EFF4FB]", text: "text-blue-600" },
          { label: "This month", value: thisMonth, color: "bg-[#F5F0FF]", text: "text-violet-600" },
        ].map(({ label, value, color, text }) => (
          <div key={label} className={cn("rounded-2xl px-5 py-4", color)}>
            <p className="mb-1 text-[11px] font-semibold text-black/40">{label}</p>
            <p className={cn("text-[28px] font-bold leading-none tracking-tight", text)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tag breakdown bar chart */}
      {tagData.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]">
          <h3 className="mb-5 text-[13px] font-semibold text-[#111110]">Notes per tag</h3>
          <div className="flex flex-col gap-3">
            {tagData.map(([tag, count]) => (
              <div key={tag} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-right text-[12px] font-medium text-black/45">{tag}</span>
                <div className="flex flex-1 items-center gap-2">
                  <div className="flex-1 overflow-hidden rounded-full bg-black/[0.04]">
                    <div
                      className="h-2 rounded-full bg-[#111110] transition-all duration-500"
                      style={{ width: `${(count / maxTagCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 text-right text-[11px] font-semibold text-black/35">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.04]">
            <BarChart2 className="h-6 w-6 text-black/15" />
          </div>
          <p className="text-sm font-semibold text-black/25">No data yet</p>
        </div>
      )}
    </div>
  );
}

// ─── View: Archive ────────────────────────────────────────────────────────────

function ArchiveView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.04]">
        <Archive className="h-6 w-6 text-black/15" />
      </div>
      <p className="text-sm font-semibold text-black/25">No archived notes</p>
      <p className="text-xs text-black/20">Archived notes will appear here</p>
    </div>
  );
}

// ─── View: Settings ───────────────────────────────────────────────────────────

function SettingsView() {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mb-6">
        <h2 className="text-[20px] font-bold tracking-tight text-[#111110]">Settings</h2>
        <p className="mt-1 text-[13px] text-black/38">Manage your workspace preferences</p>
      </div>
      <div className="max-w-lg space-y-3">
        {[
          { label: "App name", value: "TinyNote", desc: "The name shown in the sidebar" },
          { label: "Version", value: "0.1.0", desc: "Current application version" },
          { label: "Storage", value: "In-memory", desc: "Notes are stored locally in this session" },
        ].map(({ label, value, desc }) => (
          <div key={label} className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]">
            <div>
              <p className="text-[13px] font-semibold text-[#111110]">{label}</p>
              <p className="text-[11px] text-black/35">{desc}</p>
            </div>
            <span className="rounded-full bg-black/[0.04] px-3 py-1 text-[12px] font-medium text-black/45">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function NotesApp() {
  const [activeView, setActiveView] = useState<View>("notes");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [notes, setNotes] = useState<Note[]>([
    { id: "1", title: "Shopping List", content: "<ul><li>Milk</li><li>Eggs</li><li>Bread</li><li>Fruits</li><li>Vegetables</li></ul>", tags: ["shopping", "groceries"], createdAt: new Date("2024-02-22") },
    { id: "2", title: "Project Ideas", content: "<p>Build a <strong>personal website</strong> with Next.js and Tailwind CSS. Add a blog section and portfolio showcase.</p>", tags: ["coding", "projects"], createdAt: new Date("2024-02-19") },
    { id: "3", title: "Meeting Notes", content: "<p><em>Team sync discussion</em> about Q1 goals and upcoming product launches. Follow up with design team about new mockups.</p>", tags: ["work", "meetings"], createdAt: new Date("2024-02-17") },
  ]);

  const [currentNote, setCurrentNote] = useState({ id: "", title: "", content: "", tags: "" });

  // ── Derived ────────────────────────────────────────────────────────────────

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  const recentNotes = useMemo(
    () => [...notes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 2),
    [notes],
  );

  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return notes.filter((note) => {
      const matchesSearch = q === "" || note.title.toLowerCase().includes(q) || stripHtml(note.content).toLowerCase().includes(q);
      const matchesFilter = activeFilter === "All" || note.tags.includes(activeFilter);
      return matchesSearch && matchesFilter;
    });
  }, [notes, searchQuery, activeFilter]);

  const thisWeekCount = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return notes.filter((n) => n.createdAt >= weekAgo).length;
  }, [notes]);

  const taggedCount = useMemo(() => notes.filter((n) => n.tags.length > 0).length, [notes]);

  // ── Editor ─────────────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [StarterKit],
    content: currentNote.content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setCurrentNote((prev) => ({ ...prev, content: editor.getHTML() }));
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateNote = () => {
    const note: Note = {
      id: Date.now().toString(),
      title: currentNote.title,
      content: currentNote.content,
      tags: currentNote.tags.split(",").map((t) => t.trim()).filter(Boolean),
      createdAt: new Date(),
    };
    setNotes((prev) => [note, ...prev]);
    handleCloseModal();
  };

  const handleEditNote = () => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === currentNote.id
          ? { ...note, title: currentNote.title, content: currentNote.content, tags: currentNote.tags.split(",").map((t) => t.trim()).filter(Boolean) }
          : note,
      ),
    );
    handleCloseModal();
  };

  const handleDeleteNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id));

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentNote({ id: "", title: "", content: "", tags: "" });
    editor?.commands.setContent("");
  };

  const handleOpenEditModal = (note: Note) => {
    setCurrentNote({ id: note.id, title: note.title, content: note.content, tags: note.tags.join(", ") });
    editor?.commands.setContent(note.content);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleAIAssist = () => {
    const aiContent = `<p>Here's a suggested outline:</p><ul><li><strong>Introduction</strong></li><li><strong>Key Points</strong></li><li><strong>Action Items</strong></li></ul><p>Feel free to modify this structure!</p>`;
    editor?.commands.setContent(aiContent);
    setCurrentNote((prev) => ({ ...prev, content: aiContent }));
  };

  // ── Navigate to notes view with tag pre-filtered ───────────────────────────

  const handleTagFilterSelect = (tag: string) => {
    setActiveFilter(tag);
    setActiveView("notes");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F4F1] antialiased">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="flex w-56 shrink-0 flex-col bg-[#111110] px-3 py-6">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2.5 px-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
            <StickyNote className="h-3.5 w-3.5 text-[#111110]" />
          </div>
          <span className="text-[13px] font-bold tracking-tight text-white">TinyNote</span>
        </div>

        {/* General */}
        <div className="flex flex-col gap-0.5">
          <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">General</p>
          <SidebarItem icon={FileText}  label="Notes"      active={activeView === "notes"}      onClick={() => setActiveView("notes")} />
          <SidebarItem icon={Hash}      label="Tags"       active={activeView === "tags"}       onClick={() => setActiveView("tags")} />
          <SidebarItem icon={Archive}   label="Archive"    active={activeView === "archive"}    onClick={() => setActiveView("archive")} />
          <SidebarItem icon={BarChart2} label="Statistics" active={activeView === "statistics"} onClick={() => setActiveView("statistics")} />
        </div>

        {/* Tools */}
        <div className="mt-5 flex flex-col gap-0.5">
          <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">Tools</p>
          <SidebarItem
            icon={Sparkles}
            label="AI Assist"
            onClick={() => { setIsEditing(false); setIsModalOpen(true); }}
          />
          <SidebarItem icon={Settings} label="Settings" active={activeView === "settings"} onClick={() => setActiveView("settings")} />
        </div>

        {/* Bottom */}
        <div className="mt-auto flex flex-col gap-0.5 border-t border-white/[0.06] pt-4">
          <SidebarItem icon={LogOut} label="Log out" />
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* ── Notes view ────────────────────────────────────────────────── */}
        {activeView === "notes" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Hero */}
            <section className="shrink-0 border-b border-black/[0.06] bg-[#F5F4F1] px-8 pt-8 pb-7">
              <div className="flex gap-8">
                {/* Left — title + KPI cards */}
                <div className="flex-1">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#111110]">Your notes &amp; ideas</h1>
                      <p className="mt-1 text-[13px] text-black/38">{notes.length} {notes.length === 1 ? "note" : "notes"}&ensp;·&ensp;{allTags.length} tags</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black/45">This week</span>
                      <Button onClick={() => { setIsEditing(false); setIsModalOpen(true); }} size="sm" className="gap-1.5 rounded-full bg-[#111110] px-4 text-[13px] text-white hover:bg-[#111110]/80">
                        <PlusCircle className="h-3.5 w-3.5" />Add Note
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard icon={FileText} category="Notes"    title="Total notes created"        value={notes.length}          sublabel="All time"           trend="+12%" trendUp color="violet" />
                    <StatCard icon={TagIcon}  category="Tags"     title="Notes with tags"            value={taggedCount}           sublabel="Tagged notes"       trend="+5%"  trendUp color="peach"  />
                    <StatCard icon={Clock}    category="Activity" title="Added this week"            value={thisWeekCount}         sublabel="Last 7 days"                          color="sky"   />
                    <StatCard icon={Hash}     category="Library"  title="Unique tags in workspace"   value={allTags.length}        sublabel="Across all notes"                     color="mint"  />
                  </div>
                </div>

                {/* Right — recent notes */}
                <div className="w-[280px] shrink-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[13px] font-semibold text-[#111110]">Recent notes</h2>
                    <span className="text-[11px] text-black/30">{recentNotes.length} latest</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {recentNotes.map((note) => (
                      <RecentNoteCard key={note.id} note={note} onEdit={handleOpenEditModal} />
                    ))}
                    {recentNotes.length === 0 && (
                      <div className="rounded-xl border border-dashed border-black/10 p-5 text-center text-[12px] text-black/25">No notes yet</div>
                    )}
                  </div>
                  {allTags.length > 0 && (
                    <div className="mt-5">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-black/25">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allTags.map((tag) => (
                          <span key={tag} className="rounded-full bg-black/[0.05] px-2.5 py-0.5 text-[10px] font-medium text-black/40">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Filter + grid */}
            <section className="flex flex-1 flex-col overflow-hidden px-8 py-6">
              <div className="mb-5 flex shrink-0 items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {["All", ...allTags].map((f) => (
                    <button key={f} onClick={() => setActiveFilter(f)}
                      className={cn("rounded-full px-4 py-1.5 text-[12px] font-medium transition-all",
                        activeFilter === f ? "bg-[#111110] text-white" : "border border-black/10 bg-white text-black/45 hover:border-black/20 hover:text-black/70"
                      )}
                    >{f}</button>
                  ))}
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/25" />
                  <Input placeholder="Search notes…" className="h-8 rounded-full border-black/10 bg-white pl-9 text-[13px] shadow-none placeholder:text-black/25 focus-visible:ring-black/15" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredNotes.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04]">
                      <FileText className="h-5 w-5 text-black/15" />
                    </div>
                    <p className="text-sm font-semibold text-black/25">No notes found</p>
                    <p className="text-xs text-black/20">{searchQuery || activeFilter !== "All" ? "Try a different filter" : "Add your first note above"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredNotes.map((note) => (
                      <NoteCard key={note.id} note={note} onEdit={handleOpenEditModal} onDelete={handleDeleteNote} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ── Other views ───────────────────────────────────────────────── */}
        {activeView === "tags"       && <TagsView notes={notes} onFilterSelect={handleTagFilterSelect} />}
        {activeView === "archive"    && <ArchiveView />}
        {activeView === "statistics" && <StatisticsView notes={notes} />}
        {activeView === "settings"   && <SettingsView />}
      </main>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-black/[0.08] p-0 shadow-[0_24px_64px_rgba(0,0,0,0.14),0_4px_16px_rgba(0,0,0,0.06)] sm:max-w-[640px]">
          <DialogHeader className="border-b border-black/[0.06] px-6 py-5">
            <DialogTitle className="text-[15px] font-semibold tracking-tight text-[#111110]">{isEditing ? "Edit Note" : "New Note"}</DialogTitle>
            <DialogDescription className="text-[12px] text-black/35">{isEditing ? "Update the details below." : "Capture a new thought."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 px-6 py-5">
            <div className="grid gap-1.5">
              <Label htmlFor="title" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-black/30">Title</Label>
              <Input id="title" placeholder="Untitled" className="border-black/10 text-[15px] font-medium placeholder:text-black/20 focus-visible:ring-black/15" value={currentNote.title} onChange={(e) => setCurrentNote((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-black/30">Content</Label>
              <div className="min-h-[180px] overflow-hidden rounded-lg border border-black/10 bg-white p-3">
                <MenuBar editor={editor} />
                <EditorContent editor={editor} className="prose prose-sm max-w-none [&_.ProseMirror]:min-h-[136px] [&_.ProseMirror]:outline-none" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tags" className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black/30">
                <TagIcon className="h-3 w-3" />Tags
              </Label>
              <Input id="tags" placeholder="work, ideas, todo" className="border-black/10 text-sm placeholder:text-black/20 focus-visible:ring-black/15" value={currentNote.tags} onChange={(e) => setCurrentNote((prev) => ({ ...prev, tags: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between border-t border-black/[0.06] px-6 py-4 sm:justify-between">
            <Button variant="ghost" size="sm" onClick={handleAIAssist} className="gap-1.5 rounded-full text-[12px] text-black/40 hover:text-black/70">
              <Sparkles className="h-3.5 w-3.5" />AI Assist
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCloseModal} className="rounded-full border-black/10 text-[12px] text-black/50 hover:text-black">Cancel</Button>
              <Button size="sm" onClick={isEditing ? handleEditNote : handleCreateNote} disabled={!currentNote.title.trim() || !currentNote.content.trim()} className="rounded-full bg-[#111110] text-[12px] text-white hover:bg-[#111110]/80 disabled:opacity-30">
                {isEditing ? "Save Changes" : "Create Note"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
