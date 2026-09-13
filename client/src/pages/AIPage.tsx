import {
  AlertCircle,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Car,
  CircleDollarSign,
  Package,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { chatWithGarageFlowAI } from "../services/aiService";
import { useAuth } from "../hooks/useAuth";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// 6 Defined AI Tools in GarageFlow
const toolCapabilities = [
  {
    id: "activeJobs",
    icon: BriefcaseBusiness,
    iconColor: "text-indigo-600 bg-indigo-50 border-indigo-200/80",
    title: "Active Workshop Jobs",
    tool: "getActiveJobs",
    description:
      "Query all ongoing repair jobs, bay statuses, complaints, and assigned mechanics.",
    examplePrompt: "What repair jobs are currently active on the floor?",
  },
  {
    id: "serviceHistory",
    icon: Car,
    iconColor: "text-sky-600 bg-sky-50 border-sky-200/80",
    title: "Vehicle Service History",
    tool: "getVehicleServiceHistory",
    description:
      "Retrieve full repair history, prior diagnoses, and invoice totals for any vehicle registration number.",
    examplePrompt: "Show service history for vehicle WP CA-4812",
  },
  {
    id: "lowStock",
    icon: Package,
    iconColor: "text-amber-600 bg-amber-50 border-amber-200/80",
    title: "Inventory & Low Stock",
    tool: "getLowStockParts",
    description:
      "Identify spare parts at or below minimum threshold that need urgent restocking.",
    examplePrompt: "Which parts are currently low in stock?",
  },
  {
    id: "monthlyRevenue",
    icon: TrendingUp,
    iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200/80",
    title: "Monthly Revenue Analytics",
    tool: "getMonthlyRevenue",
    description:
      "Calculate total earnings and payments collected during the current calendar month.",
    examplePrompt: "How much revenue have we collected this month?",
  },
  {
    id: "outstandingInvoices",
    icon: CircleDollarSign,
    iconColor: "text-rose-600 bg-rose-50 border-rose-200/80",
    title: "Outstanding Invoices",
    tool: "getOutstandingInvoices",
    description:
      "List unpaid and partially paid customer bills, remaining balances, and invoice numbers.",
    examplePrompt: "Show all unpaid invoices and outstanding balances",
  },
  {
    id: "mechanicPerformance",
    icon: Users,
    iconColor: "text-violet-600 bg-violet-50 border-violet-200/80",
    title: "Mechanic Performance",
    tool: "getMechanicPerformance",
    description:
      "Inspect workload distributions, completed jobs, and delivery metrics per technician.",
    examplePrompt: "How are mechanics performing in terms of completed jobs?",
  },
];

export default function AIPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (messageText?: string) => {
    const text = (messageText ?? input).trim();

    if (!text || isLoading) {
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: timeStr,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithGarageFlowAI(text);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      toast.error("Unable to get a response from GarageFlow AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage();
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success("Conversation cleared");
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              GarageFlow AI Assistant
            </h1>
            <p className="text-xs text-slate-500">
              Interactive garage intelligence backed by live database tools.
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 sm:self-auto"
          >
            <RotateCcw size={13} />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs min-h-[600px]">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="px-6 py-8 sm:px-8">
              {/* Intro Banner */}
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20">
                  <Sparkles size={22} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  What would you like to know, {user?.name?.split(" ")[0] || "there"}?
                </h2>
                <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                  GarageFlow AI uses real-time tools connected directly to your workshop data. Select any capability below or ask your own question.
                </p>
              </div>

              {/* Defined Tools Grid */}
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Available AI Capabilities (6 Defined Tools)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Click any prompt to ask
                  </span>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {toolCapabilities.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={tool.id}
                        className="group flex flex-col justify-between rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 transition-all hover:border-indigo-300 hover:bg-white hover:shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2.5 mb-2.5">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${tool.iconColor}`}
                            >
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-slate-900 truncate">
                                {tool.title}
                              </p>
                              <span className="font-mono text-[10px] text-slate-400">
                                {tool.tool}()
                              </span>
                            </div>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-500">
                            {tool.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => sendMessage(tool.examplePrompt)}
                          disabled={isLoading}
                          className="mt-3.5 inline-flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-700 transition group-hover:border-indigo-200 group-hover:text-indigo-700 disabled:opacity-50"
                        >
                          <span className="truncate pr-2 italic">
                            "{tool.examplePrompt}"
                          </span>
                          <ArrowRight
                            size={12}
                            className="shrink-0 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5"
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-5 sm:p-6">
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                        <Bot size={16} />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed sm:text-sm sm:leading-relaxed ${
                        isUser
                          ? "bg-slate-900 text-white shadow-xs"
                          : "border border-slate-200/80 bg-slate-50 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isUser ? "text-slate-300" : "text-indigo-600"
                          }`}
                        >
                          {isUser ? "You" : "GarageFlow AI"}
                        </span>
                        <span
                          className={`text-[10px] ${
                            isUser ? "text-slate-400" : "text-slate-400"
                          }`}
                        >
                          {message.timestamp}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 font-bold text-xs shadow-xs">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                    <Bot size={16} />
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-600" />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-600"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-600"
                        style={{ animationDelay: "300ms" }}
                      />
                      <span className="ml-2 text-xs text-slate-500 font-medium">
                        Consulting garage database tools...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="border-t border-slate-100 bg-white p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-2.5">
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Ask about active jobs, low stock, revenue, or vehicle history..."
                rows={2}
                disabled={isLoading}
                className="w-full resize-none rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-50 disabled:bg-slate-100 sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <AlertCircle size={12} className="text-slate-400" />
              Read-only tool operations. Sensitive data restricted to Owner & Manager.
            </span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}
