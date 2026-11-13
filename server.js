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
    { cat: "Despedida de Soltero", q: "¿Cuál es una comida que ambos disfrutan?", a: ["Carne Asada", "Sushi", "Tacos al pastor", "Ceviche"], correct: 3 },
    { cat: "Despedida de Soltero", q: "¿Cuántos años tiene Carla?", a: ["29", "30", "31", "32"], correct: 2 },
    { cat: "Despedida de Soltero", q: "¿Cuánto tiempo llevaban de novios cuando se comprometieron?", a: ["9 años", "11 años", "10 años", "12 años"], correct: 1 },
    { cat: "Despedida de Soltero", q: "¿Quién dio el primer paso en la relación?", a: ["Bernal", "Carla", "Fue mutuo al mismo tiempo", "Un amigo los presentó y los empujó"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Quién suele elegir dónde van a comer?", a: ["Bernal", "Siempre hacen piedra, papel o tijera", "Carla", "Tiran una moneda"], correct: 2 },
    { cat: "Despedida de Soltero", q: "¿Qué equipo de fútbol sigue Bernal?", a: ["Aguila", "FC Barcelona", "PSG", "Gooners (4rsenal)"], correct: 3 },
    { cat: "Despedida de Soltero", q: "¿Qué tipo de piedra tiene el anillo con el que Bernal le propuso a Carla?", a: ["Diamante", "Zafiro", "Esmeralda", "Rubí"], correct: 1 },
    { cat: "Despedida de Soltero", q: "¿Quién suele tomar más fotos cuando salen juntos?", a: ["Carla", "Bernal", "Ninguno toma fotos", "Siempre le piden a alguien más"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Cuál de estas cosas NUNCA haría Bernal en su boda?", a: ["Bailar el vals", "Llorar en el altar", "Chulonearme", "Dar un discurso"], correct: 2 },
    { cat: "Despedida de Soltero", q: "¿Qué estilo de música (o artista) es imposible que suene en su boda?", a: ["Juan Luis Guerra", "Bacilos", "Chichi Peralta", "Los REDD"], correct: 1 },
    { cat: "Despedida de Soltero", q: "¿Cuántos invitados se esperan en la boda?", a: ["125", "135", "120", "130"], correct: 3 },
    { cat: "Despedida de Soltero", q: "¿Dónde se dieron su primer beso Bernal y Carla?", a: ["En una fiesta", "En la universidad", "En un bar", "En la playa"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Cuál es la bebida alcohólica favorita de Bernal en una fiesta?", a: ["Cerveza", "Tequila", "Ron", "Whisky"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Quién tarda más tiempo en alistarse para salir?", a: ["Carla", "Bernal", "Los dos tardan exactamente lo mismo", "Depende de quién maneje"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Quién suele pedir perdón primero después de una discusión?", a: ["Bernal", "Carla", "Ninguno, esperan a que se les pase", "Se arreglan pidiendo comida"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Cuál es el destino de luna de miel de Bernal y Carla?", a: ["Europa", "Caribe / Playa", "Asia", "Estados Unidos"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Cuál es la mayor maña o costumbre rara de Bernal en casa?", a: ["Dejar la toalla mojada en la cama", "Quedarse dormido viendo series", "Dejar los zapatos por toda la casa", "Tardarse horas en el baño"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Quién maneja mejor según ellos mismos?", a: ["Bernal", "Carla", "Los dos dicen que el otro maneja mal", "Prefieren pedir Uber"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Cuál es el apodo cariñoso que más usan entre ellos?", a: ["Amor / Mi amor", "Gordo / Gorda", "Bebé", "Por su nombre"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Qué es lo que más le enoja a Bernal cuando ve jugar al Arsenal (Gooners)?", a: ["El arbitraje", "Cuando fallan goles cantados", "Los cambios del técnico", "Los comentaristas"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Quién es más probable que termine hasta tarde en la fiesta de la boda?", a: ["Bernal", "Carla", "Los dos hasta que apaguen las luces", "Ninguno, se van temprano al hotel"], correct: 0 },
{ cat: "Despedida de Soltero", q: "¿Qué fue lo primero que le llamó la atención a Bernal de Carla cuando la conoció?", a: ["Su sonrisa", "Sus ojos", "Su sentido del humor", "Su forma de bailar"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Cuál es la comida o ingrediente que Bernal detesta y nunca pediría?", a: ["Cebolla", "Aceitunas", "Aguacate", "Hongos / Champiñones"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Quién es más gastador o impulsivo con las compras en pareja?", a: ["Carla", "Bernal", "Los dos son igual de ahorradores", "Depende de si es ropa o tecnología"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Cuál es el plan perfecto de domingo para Bernal y Carla?", a: ["Quedarse viendo series todo el día", "Ir a almorzar en familia", "Salir a pasear con sus perros", "Ir a la playa o lago"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Qué serie o película han visto juntos más de una vez?", a: ["Friends", "The Office", "How I Met Your Mother", "Harry Potter"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Quién se queda dormido primero cuando ponen una película en la noche?", a: ["Carla", "Bernal", "Los dos se duermen a los 15 minutos", "Ninguno, siempre la terminan"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Cuál es el regalo más memorable que Bernal le ha dado a Carla?", a: ["Un viaje sorpresa", "Una joya o reloj", "Un álbum o carta hecha a mano", "Su mascota"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Qué canción no puede faltar en la fiesta de la boda para que Bernal se suba a bailar?", a: ["Un clásico de reggaetón viejo", "Una cumbia / merengue", "Un rock en español", "Una salsa"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Quién es más probable que llore primero durante los votos de la boda?", a: ["Bernal", "Carla", "Los dos van a llorar al mismo tiempo", "Ninguno, son de piedra"], correct: 0 },
    { cat: "Despedida de Soltero", q: "¿Cuántos hijos han dicho que les gustaría tener en el futuro?", a: ["2", "1", "3", "Solo perrijos por ahora"], correct: 0 },
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
