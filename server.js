const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ==========================================
// BASE DE DATOS DE PREGUNTAS
// ==========================================
const questionsDB = [
  { cat: "Despedida de Soltero", q: "¿Cuál es el nombre completo de Bernal (con ambos apellidos)?", a: ["Gerardo José Bernal López", "Gerardo José Bernal Serrano", "Gerardo Antonio Bernal Serrano", "Carlos José Bernal Serrano"], correct: 1 },
    { cat: "Despedida de Soltero", q: "¿Cuál es el nombre completo de Carla (con ambos apellidos)?", a: ["Carla Eugenia Humber Munguía", "Carla María Humber Munguía", "Carla Eugenia Munguía Humber", "Carla Sofía Humber Méndez"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿En donde y en qué lugar (exacto) la propuso matrimonio?", a: ["En Corinto, frente al mar", "En el Volcán de San Salvador", "En Corinto, en el mirador del Club Salvadoreño", "En Corinto, en un muelle"], correct: 2 },
    { cat: "Despedida de Soltero", q: "¿Dónde se van a casar (lugar de la ceremonia)?", a: ["Montelena", "En Corinto, Club Salvadoreño", "Hotel Real InterContinental", "Finca San Ernesto"], correct: 1 },
    { cat: "Despedida de Soltero", q: "¿En qué año se conocieron Bernal y Carla?", a: ["2010", "2012", "2013", "2011"], correct: 3 },
    { cat: "Despedida de Soltero", q: "¿Cuál fue el primer viaje que hicieron juntos?", a: ["Miami, Florida", "Tampa, Florida", "Antigua Guatemala", "Roatán, Honduras"], correct: 1 },
    { cat: "Despedida de Soltero", q: "¿Cuántas mascotas tienen en conjunto Bernal y Carla?", a: ["1 (Benito)", "3 (Benito, Valentino y Bobby)", "2 Benito y Valentino (4 si es Bobby y Pablo)", "Ninguna"], correct: 2 },
    { cat: "Despedida de Soltero", q: "¿Qué les gusta hacer juntos en su tiempo libre?", a: ["Ir al Majestic", "Hablar mierda de Perna", "Ir a la Playa y empanizarnos", "Cocinar"], correct: 1 },
    { cat: "Despedida de Soltero", q: "¿En qué mes celebran su aniversario de novios?", a: ["Mayo (29/05/2014)", "Abril (15/04/2014)", "Junio (29/06/2014)", "Agosto (12/08/2014)"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Cuál es una comida que ambos disfrutan?", a: ["Carnia Asada", "Sushi", "Tacos al pastor", "Ceviche"], correct: 3 },
    { cat: "Despedida de Soltero", q: "¿Cuántos años tiene Carla?", a: ["29", "30", "31", "32"], correct: 2 },
    { cat: "Despedida de Soltero", q: "¿Cuánto tiempo llevaban de novios cuando se comprometieron?", a: ["9 años", "11 años", "10 años", "12 años"], correct: 1 },
    { cat: "Despedida de Soltero", q: "¿Quién dio el primer paso en la relación?", a: ["Bernal", "Carla", "Fue mutuo al mismo tiempo", "Un amigo los presentó y los empujó"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Quién suele elegir dónde van a comer?", a: ["Bernal", "Siempre hacen piedra, papel o tijera", "Carla", "Tiran una moneda"], correct: 2 },
    { cat: "Despedida de Soltero", q: "¿Qué equipo de fútbol sigue Bernal?", a: ["Aguila", "FC Barcelona", "PSG", "Gooners (4rsenal)"], correct: 3 },
    { cat: "Despedida de Soltero", q: "¿Qué tipo de piedra tiene el anillo con el que Bernal le propuso a Carla?", a: ["Diamante", "Zafiro", "Esmeralda", "Rubí"], correct: 1 },
    { cat: "Despedida de Soltero", q: "¿Quién suele tomar más fotos cuando salen juntos?", a: ["Carla", "Bernal", "Ninguno toma fotos", "Siempre le piden a alguien más"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Cuál de estas cosas NUNCA haría Bernal en su boda?", a: ["Bailar el vals", "Llorar en el altar", "Chulonearme", "Dar un discurso"], correct: 2 },
    { cat: "Despedida de Soltero", q: "¿Qué estilo de música (o artista) es imposible que suene en su boda?", a: ["Juan Luis Guerra", "Bacilos", "Chichi Peralta", "Los REDD"], correct: 1 },
    { cat: "Despedida de Soltero", q: "¿Cuántos invitados se esperan en la boda?", a: ["125", "135", "120", "130"], correct: 3 }
];

let rooms = {};

io.on('connection', (socket) => {
    console.log(`🔌 Cliente: ${socket.id}`);
    
    socket.on('createRoom', () => {
        const roomId = Math.floor(1000 + Math.random() * 9000).toString();
        
        // MODIFICACIÓN 1: Creamos un array con los índices de todas las preguntas (0, 1, 2... etc)
        // Esto crea un "mazo" de cartas disponible para ESTA sala.
        const availableQuestions = questionsDB.map((_, index) => index);

        rooms[roomId] = {
            hostId: socket.id,
            players: {},
            currentQuestion: null,
            state: 'lobby',
            roundsPlayed: 0,
            totalRounds: 5,
            availableQuestions: availableQuestions // Guardamos el mazo en la sala
        };
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', ({ roomId, name }) => {
        const room = rooms[roomId];
        if (room && room.state === 'lobby') {
            const avatars = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮'];
            const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
            
            room.players[socket.id] = { 
                id: socket.id, 
                name: name, 
                score: 0, 
                avatar: randomAvatar,
                hasAnswered: false 
            };
            
            socket.join(roomId);
            io.to(room.hostId).emit('updatePlayerList', Object.values(room.players));
            socket.emit('joinedSuccess', roomId);
        } else {
            socket.emit('errorMsg', 'Sala no existe o ya empezó.');
        }
    });

    socket.on('startGame', ({ roomId, limit }) => {
        const room = rooms[roomId];
        if (room) {
            // MODIFICACIÓN 2: Ajuste inteligente de rondas
            // Si piden 20 rondas pero solo hay 10 preguntas, ajustamos el límite a 10.
            const requestedLimit = parseInt(limit) || 5;
            room.totalRounds = Math.min(requestedLimit, room.availableQuestions.length);
            
            room.state = 'playing';
            room.roundsPlayed = 0;
            sendNextQuestion(roomId);
        }
    });

    socket.on('submitAnswer', ({ roomId, answerIndex, timeLeft }) => {
        const room = rooms[roomId];
        if (!room || !room.currentQuestion) return;

        const player = room.players[socket.id];
        if (!player || player.hasAnswered) return;

        player.hasAnswered = true;
        const correctIdx = parseInt(room.currentQuestion.correct);
        const receivedIdx = parseInt(answerIndex);
        const isCorrect = (receivedIdx === correctIdx);
        const correctAnswerText = room.currentQuestion.a[correctIdx];

        if (isCorrect) {
            const maxPoints = 1000;
            const speedBonus = Math.floor((timeLeft / 30) * 500); 
            player.score += (maxPoints + speedBonus);
        }
        
        socket.emit('answerResult', { isCorrect, correctText: correctAnswerText });

        const sortedPlayers = Object.values(room.players).sort((a, b) => b.score - a.score);
        io.to(room.hostId).emit('updateLeaderboard', sortedPlayers);

        const allPlayers = Object.values(room.players);
        const activePlayers = allPlayers.filter(p => p.id !== room.hostId); 
        const allAnswered = activePlayers.every(p => p.hasAnswered);

        if (allAnswered && activePlayers.length > 0) {
            io.to(roomId).emit('roundEnded', { correctIndex: correctIdx });
        }
    });

    socket.on('nextQuestion', (roomId) => {
        sendNextQuestion(roomId);
    });

    socket.on('timeUp', (roomId) => {
        const room = rooms[roomId];
        if(room && room.currentQuestion) {
             io.to(roomId).emit('roundEnded', { correctIndex: room.currentQuestion.correct });
        }
    });

    function sendNextQuestion(roomId) {
        const room = rooms[roomId];
        if(!room) return;

        // MODIFICACIÓN 3: Lógica de Fin de Juego
        // El juego termina si se alcanzaron las rondas pactadas O si ya no quedan preguntas en el mazo.
        if (room.roundsPlayed >= room.totalRounds || room.availableQuestions.length === 0) {
            const sortedPlayers = Object.values(room.players).sort((a, b) => b.score - a.score);
            const winner = sortedPlayers.length > 0 ? sortedPlayers[0] : null;
            io.to(roomId).emit('gameOver', { winner: winner });
            return; 
        }

        Object.values(room.players).forEach(p => p.hasAnswered = false);
        room.roundsPlayed++; 

        // MODIFICACIÓN 4: Selección sin repetición
        // 1. Elegimos un índice aleatorio DENTRO de los disponibles en la sala
        const randomIndex = Math.floor(Math.random() * room.availableQuestions.length);
        
        // 2. Obtenemos el índice real de la pregunta en la Base de Datos
        const questionDbIndex = room.availableQuestions[randomIndex];
        
        // 3. Eliminamos ese índice del array de disponibles para que no vuelva a salir
        room.availableQuestions.splice(randomIndex, 1);

        // 4. Obtenemos la pregunta completa
        const q = questionsDB[questionDbIndex];
        room.currentQuestion = q;
        
        io.to(roomId).emit('newQuestion', {
            cat: q.cat,
            q: q.q,
            options: q.a,
            time: 30,
            currentRound: room.roundsPlayed,
            totalRounds: room.totalRounds
        });
    }

    socket.on('disconnect', () => {
        Object.keys(rooms).forEach(roomId => {
            const room = rooms[roomId];
            if (room.players[socket.id]) {
                delete room.players[socket.id];
                io.to(room.hostId).emit('updatePlayerList', Object.values(room.players));
            }
            if (room.hostId === socket.id) delete rooms[roomId];
        });
    });
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log(`✅ SERVIDOR LISTO EN PUERTO ${port}`);
});
