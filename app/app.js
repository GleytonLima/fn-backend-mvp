const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const dbdomain = process.env.DB_DOMAIN || 'localhost';
const production = process.env.PRODUCTION || false;

if (production) {
  const dbuser = process.env.DB_USER;
  const dbpassword = process.env.DB_PASSWORD;
  const appName = process.env.APP_NAME;
  const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

  mongoose.connect(`mongodb+srv://${dbuser}:${dbpassword}@${dbdomain}/?retryWrites=true&w=majority&appName=${appName}`, clientOptions)
    .then(() => {
      mongoose.connection.db.admin().command({ ping: 1 });  
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    })
    .catch(err => console.error(err));
} else {
  mongoose.connect(`mongodb://${dbdomain}:27017/voluntariosDB`, { useNewUrlParser: true, useUnifiedTopology: true });
}

const voluntarioSchema = new mongoose.Schema({
  id: Number,
  nomeCompleto: String,
  graduacaoFormacao: String,
  especializacao: String,
  areaAtuacao: String,
  registroConselhoClasse: String,
  disponibilidadeViagens: String,
  cpf: String,
  uf: String,
  celularWhatsapp: String,
  email: String,
  dominioIdiomas: [String],
  linkCurriculoLattes: String
});

const missaoSchema = new mongoose.Schema({
  id: Number,
  tipo: String,
  descricao: String,
  situacao: String,
  dataInicio: String,
  localizacao: String,
  apoioNecessario: [String],
  filtroVoluntarios: {}
});

const Voluntario = mongoose.model('Voluntario', voluntarioSchema);
const Missao = mongoose.model('Missao', missaoSchema, 'missoes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/api/voluntarios', async (req, res) => {
  try {    
    const idMissao = req.query.missao_id;
    const nomeCompleto = req.query.nome_completo ?? '';
    if (!idMissao) {
      const voluntarios = await Voluntario.find({
        nomeCompleto: new RegExp(nomeCompleto, 'i')
      });
      res.send(voluntarios);
    } else {      
      const missao = await Missao.findById(idMissao);
      console.log(JSON.stringify(missao));
      if (!missao?.filtroVoluntarios) {
        res.send([]);
      }
      const filtroFinal = { ...missao.filtroVoluntarios, nomeCompleto: new RegExp(nomeCompleto, 'i') };
      const voluntarios = await Voluntario.find(filtroFinal);
      console.log(JSON.stringify(voluntarios));
      res.send(voluntarios);
    }
  } catch (error) {
    res.send({ error: error.message });
  }
});

app.get('/api/missoes-tipos', async (req, res) => {
  try {
    const missoes = await Missao.find();
    res.send(missoes);
  } catch (error) {
    res.send({ error: error.message });
  }
});

// atualiza a missão
app.put('/api/missoes/:id', async (req, res) => {
  const id = req.params.id;
  const missao = await Missao.findById(id);
  missao.set(req.body);
  await missao.save();
  res.send(missao);
});


app.listen(3000, () => console.log('Server running on port 3000'));