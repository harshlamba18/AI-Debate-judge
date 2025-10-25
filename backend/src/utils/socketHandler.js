const Argument = require('../models/Argument');
const Debate = require('../models/Debate');

const socketHandler = (io) => {
  const debateRooms = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on('join-debate', async (debateId) => {
      try {
        socket.join(debateId);
        
        if (!debateRooms.has(debateId)) {
          debateRooms.set(debateId, new Set());
        }
        debateRooms.get(debateId).add(socket.id);

        const debate = await Debate.findById(debateId)
          .populate('sideA.users sideB.users', 'username');
        
        const debateArguments = await Argument.find({ debateId })
          .populate('userId', 'username')
          .sort('order');

        socket.emit('debate-state', {
          debate,
          arguments: debateArguments,
          participants: debateRooms.get(debateId).size
        });

        io.to(debateId).emit('participant-joined', {
          participants: debateRooms.get(debateId).size
        });

        console.log(`User ${socket.id} joined debate ${debateId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('leave-debate', (debateId) => {
      socket.leave(debateId);
      
      if (debateRooms.has(debateId)) {
        debateRooms.get(debateId).delete(socket.id);
        
        io.to(debateId).emit('participant-left', {
          participants: debateRooms.get(debateId).size
        });

        if (debateRooms.get(debateId).size === 0) {
          debateRooms.delete(debateId);
        }
      }

      console.log(`User ${socket.id} left debate ${debateId}`);
    });

    socket.on('new-argument', async (data) => {
      try {
        const { debateId, argumentId } = data;
        
        const argument = await Argument.findById(argumentId)
          .populate('userId', 'username');

        io.to(debateId).emit('argument-added', argument);

        const argCountA = await Argument.countDocuments({ debateId, side: 'A' });
        const argCountB = await Argument.countDocuments({ debateId, side: 'B' });
        
        const debate = await Debate.findById(debateId);
        
        if (argCountA >= debate.settings.argumentLimit && 
            argCountB >= debate.settings.argumentLimit) {
          io.to(debateId).emit('debate-ready-for-judging', { debateId });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('typing', (data) => {
      const { debateId, username, side } = data;
      socket.to(debateId).emit('user-typing', { username, side });
    });

    socket.on('stop-typing', (data) => {
      const { debateId, username } = data;
      socket.to(debateId).emit('user-stop-typing', { username });
    });

    socket.on('debate-judged', async (data) => {
      const { debateId } = data;
      
      try {
        const debate = await Debate.findById(debateId)
          .populate('sideA.users sideB.users', 'username');

        io.to(debateId).emit('judgment-received', {
          debate,
          judgment: debate.aiJudgment
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      debateRooms.forEach((participants, debateId) => {
        if (participants.has(socket.id)) {
          participants.delete(socket.id);
          
          io.to(debateId).emit('participant-left', {
            participants: participants.size
          });

          if (participants.size === 0) {
            debateRooms.delete(debateId);
          }
        }
      });

      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = socketHandler;