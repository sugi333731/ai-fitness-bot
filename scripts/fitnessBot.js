require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const axios = require('axios');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
});

const User = sequelize.define('users', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: DataTypes.STRING,
  height: DataTypes.STRING,
  weight: DataTypes.STRING,
  goal: DataTypes.STRING,
});

const TrainingPlan = sequelize.define('training_plans', {
  user_id: DataTypes.STRING,
  day_of_week: DataTypes.STRING,
  exercise: DataTypes.STRING,
  sets: DataTypes.INTEGER,
  reps: DataTypes.INTEGER,
});

module.exports = (robot) => {
  const userState = {};

  robot.hear(/.*/, async (res) => {
    const id = res.message.user.id;
    const text = res.message.text;

    if (!userState[id]) {
      userState[id] = { step: 'start' };
      return res.send('こんにちは！筋トレプランナーです。まずは身長を選んでください。', {
        options: ['160cm未満', '160-170cm', '170-180cm', '180cm以上']
      });
    }

    const state = userState[id];

    if (state.step === 'start') {
      state.height = text;
      state.step = 'weight';
      return res.send('ありがとうございます！体重はいかがですか？', {
        options: ['50kg未満', '50-60kg', '60-70kg', '70kg以上']
      });
    }

    if (state.step === 'weight') {
      state.weight = text;
      state.step = 'goal';
      return res.send('目標を選んでください', {
        options: ['筋力アップ', 'ダイエット', '健康維持']
      });
    }

    if (state.step === 'goal') {
      state.goal = text;
      state.step = 'done';

      await User.upsert({
        id: id,
        name: res.message.user.name,
        height: state.height,
        weight: state.weight,
        goal: state.goal
      });

      await TrainingPlan.destroy({ where: { user_id: id } });

      const plan = [
        ['月曜', 'プッシュアップ', 3, 10],
        ['火曜', 'スクワット', 4, 12],
        ['水曜', '休み', 0, 0],
        ['木曜', '腹筋', 3, 15],
        ['金曜', 'プランク', 3, 1], // 1分
      ];

      for (const p of plan) {
        await TrainingPlan.create({
          user_id: id,
          day_of_week: p[0],
          exercise: p[1],
          sets: p[2],
          reps: p[3]
        });
      }

      return res.send(`素晴らしい！今日のプランは「${plan[0][1]} ${plan[0][3]}回 × ${plan[0][2]}セット」です。`, {
        options: ['完了しました', 'スキップ', '動画を見る']
      });
    }

    if (state.step === 'done') {
      if (text === '動画を見る') {
        const query = 'プッシュアップ 正しいフォーム';
        const apiKey = process.env.YOUTUBE_API_KEY;
        const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=1`;

        try {
          const response = await axios.get(url);
          const videoId = response.data.items[0].id.videoId;
          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          return res.send(`こちらの動画をご覧ください！\n${videoUrl}`, {
            options: ['完了しました', 'スキップ']
          });
        } catch (err) {
          console.error(err);
          return res.send('動画の取得に失敗しました。');
        }
      } else {
        return res.send('また明日も頑張りましょう！');
      }
    }
  });
};
