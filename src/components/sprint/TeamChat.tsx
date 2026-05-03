import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Send } from "lucide-react";

interface Message {
  id: string;
  sprint_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  department_id?: string | null;
  sender_name?: string;
}

interface TeamChatProps {
  sprintId: string;
  departmentId?: string | null;
}

export function TeamChat({ sprintId, departmentId }: TeamChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    const filter = departmentId
      ? `sprint_id=eq.${sprintId}`
      : `sprint_id=eq.${sprintId}`;
    const channel = supabase
      .channel(`sprint-chat-${sprintId}-${departmentId || "none"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sprint_messages",
          filter,
        },
        (payload) => {
          const msg = payload.new as Message;
          // Filter by department locally
          if (departmentId && msg.department_id !== departmentId) return;
          if (!departmentId && msg.department_id) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (!profileMap.has(msg.sender_id)) {
            supabase
              .from("profiles")
              .select("full_name")
              .eq("id", msg.sender_id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setProfileMap((prev) => new Map(prev).set(msg.sender_id, data.full_name || "Anonymous"));
                }
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sprintId, departmentId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("sprint_messages")
      .select("id, sprint_id, sender_id, message_text, created_at")
      .eq("sprint_id", sprintId)
      .order("created_at", { ascending: true })
      .limit(200);

    const msgs = (data || []) as Message[];
    setMessages(msgs);

    // Fetch sender profiles
    const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", senderIds);

      const map = new Map<string, string>();
      (profiles || []).forEach((p) => map.set(p.id, p.full_name || "Anonymous"));
      setProfileMap(map);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);

    const { error } = await supabase.from("sprint_messages").insert({
      sprint_id: sprintId,
      sender_id: user.id,
      message_text: newMessage.trim(),
    });

    if (error) {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="w-5 h-5 text-builder" />
          Team Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0 gap-3">
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const name = profileMap.get(msg.sender_id) || "Anonymous";
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                    {!isMe && <p className="text-xs font-semibold mb-1 opacity-70">{name}</p>}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
