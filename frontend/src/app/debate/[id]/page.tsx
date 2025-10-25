'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Send, Scale, ArrowLeft, Trophy, ExternalLink } from 'lucide-react';
import { debateAPI, argumentAPI } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import toast from 'react-hot-toast';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

export default function DebateRoom() {
  const router = useRouter();
  const params = useParams();
  const debateId = params.id as string;

  const [debate, setDebate] = useState<any>(null);
  const [debateArguments, setDebateArguments] = useState<any[]>([]);
  const [newArgument, setNewArgument] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sending, setSending] = useState(false);
  const [judging, setJudging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadDebate();
    loadArguments();

    const newSocket = io(WS_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket');
      newSocket.emit('join-debate', debateId);
    });

    newSocket.on('debate-state', (data) => {
      setDebate(data.debate);
      setDebateArguments(data.arguments);
    });

    newSocket.on('argument-added', (argument) => {
      setDebateArguments((prev) => [...prev, argument]);
    });

    newSocket.on('debate-ready-for-judging', () => {
      toast.success('All arguments submitted! Ready for judging.');
      loadDebate();
    });

    newSocket.on('judgment-received', (data) => {
      setDebate(data.debate);
      toast.success('AI Judge has delivered the verdict!');
    });

    return () => {
      newSocket.emit('leave-debate', debateId);
      newSocket.disconnect();
    };
  }, [debateId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [debateArguments]);

  const loadDebate = async () => {
    try {
      const { data } = await debateAPI.getById(debateId);
      setDebate(data);
    } catch (error) {
      toast.error('Failed to load debate');
    }
  };

  const loadArguments = async () => {
    try {
      const { data } = await argumentAPI.getByDebate(debateId);
      setDebateArguments(data);
    } catch (error) {
      toast.error('Failed to load arguments');
    }
  };

  const getUserSide = () => {
    if (!user || !debate) return null;
    if (debate.sideA.users.some((u: any) => u._id === user.id)) return 'A';
    if (debate.sideB.users.some((u: any) => u._id === user.id)) return 'B';
    return null;
  };

  const canSubmitArgument = () => {
    const side = getUserSide();
    if (!side || !debate) return false;
    const sideArgs = debateArguments.filter(a => a.side === side);
    return debate.status === 'active' && sideArgs.length < debate.settings.argumentLimit;
  };

  const handleSubmitArgument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArgument.trim() || !canSubmitArgument()) return;

    setSending(true);
    try {
      const { data } = await argumentAPI.create({
        debateId,
        content: newArgument,
        side: getUserSide(),
        type: 'argument',
      });

      socket?.emit('new-argument', { debateId, argumentId: data._id });
      setNewArgument('');
      toast.success('Argument submitted!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit argument');
    } finally {
      setSending(false);
    }
  };

  const handleJudge = async () => {
    if (!window.confirm('Are you sure you want to request AI judgment? This cannot be undone.')) return;

    setJudging(true);
    try {
      const { data } = await debateAPI.judge(debateId);
      setDebate(data);
      socket?.emit('debate-judged', { debateId });
      toast.success('AI judgment complete!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to judge debate');
    } finally {
      setJudging(false);
    }
  };

  if (!debate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-gray-500">Loading debate...</div>
      </div>
    );
  }

  const userSide = getUserSide();
  const sideAArgs = debateArguments.filter(a => a.side === 'A');
  const sideBArgs = debateArguments.filter(a => a.side === 'B');
  const canJudge = debate.status === 'active' &&
    sideAArgs.length >= debate.settings.argumentLimit &&
    sideBArgs.length >= debate.settings.argumentLimit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-lg shadow-md rounded-2xl p-4 mb-6 max-w-7xl mx-auto flex justify-between items-center">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-semibold text-gray-900">{debate.topic}</span>
        </div>
        <div className="w-32"></div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {debate.status === 'completed' && debate.aiJudgment && (
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">AI Judge Verdict</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className={`p-6 rounded-lg ${debate.aiJudgment.sideAScore > debate.aiJudgment.sideBScore ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Side A Score</h3>
                <p className="text-4xl font-bold text-blue-600">{debate.aiJudgment.sideAScore}</p>
              </div>
              <div className={`p-6 rounded-lg ${debate.aiJudgment.sideBScore > debate.aiJudgment.sideAScore ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Side B Score</h3>
                <p className="text-4xl font-bold text-purple-600">{debate.aiJudgment.sideBScore}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Verdict</h3>
              <p className="text-gray-700">{debate.aiJudgment.verdict}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Reasoning</h3>
              <p className="text-gray-700">{debate.aiJudgment.reasoning}</p>
            </div>

            {debate.aiJudgment.transactionHash && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Blockchain Record:</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${debate.aiJudgment.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span className="font-mono">{debate.aiJudgment.transactionHash.slice(0, 10)}...</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sides Column */}
          <div className="lg:col-span-1 space-y-4">
            <SideCard side="A" users={debate.sideA.users} position={debate.sideA.position} currentUserId={user?.id} argumentsCount={sideAArgs.length} argumentLimit={debate.settings.argumentLimit} color="blue" />
            <SideCard side="B" users={debate.sideB.users} position={debate.sideB.position} currentUserId={user?.id} argumentsCount={sideBArgs.length} argumentLimit={debate.settings.argumentLimit} color="purple" />

            {canJudge && userSide && (
              <button
                onClick={handleJudge}
                disabled={judging}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 transition"
              >
                {judging ? 'Requesting AI Judge...' : 'Request AI Judgment'}
              </button>
            )}
          </div>

          {/* Arguments Column */}
          <div className="lg:col-span-3 bg-white/90 backdrop-blur-lg rounded-2xl shadow-md flex flex-col h-[calc(100vh-200px)]">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Debate Arguments</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {debateArguments.length === 0 ? (
                <div className="text-center text-gray-500 py-12">No arguments yet. Be the first to submit!</div>
              ) : (
                debateArguments.map((arg) => (
                  <div
                    key={arg._id}
                    className={`p-4 rounded-lg ${arg.side === 'A' ? 'bg-blue-50 ml-0 mr-12' : 'bg-purple-50 ml-12 mr-0'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-gray-900">{arg.userId.username} (Side {arg.side})</span>
                      <span className="text-xs text-gray-500">{new Date(arg.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-gray-700">{arg.content}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {userSide && debate.status === 'active' && (
              <form onSubmit={handleSubmitArgument} className="p-4 border-t border-gray-200">
                {canSubmitArgument() ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newArgument}
                      onChange={(e) => setNewArgument(e.target.value)}
                      placeholder="Enter your argument..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newArgument.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition"
                    >
                      <Send className="w-4 h-4" />
                      <span>{sending ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-2">You have reached the argument limit for this debate.</div>
                )}
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SideCard({ side, users, position, currentUserId, argumentsCount, argumentLimit, color }: any) {
  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-md p-4">
      <h3 className="font-semibold text-gray-900 mb-2">Side {side}</h3>
      <p className="text-sm text-gray-600 mb-2">{position}</p>
      {users.map((u: any) => (
        <div
          key={u._id}
          className={`text-sm px-3 py-2 rounded mb-2 ${
            u._id === currentUserId ? `bg-${color}-100 text-${color}-900 font-semibold` : 'bg-gray-100 text-gray-700'
          }`}
        >
          {u.username}
        </div>
      ))}
      <p className="text-xs text-gray-500 mt-2">
        Arguments: {argumentsCount}/{argumentLimit}
      </p>
    </div>
  );
}
