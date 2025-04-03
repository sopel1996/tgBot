require("dotenv").config();
// Обращаемся к библиотеке grammy и импортируем класс Bot
const { Bot, Keyboard } = require("grammy");
// Создаем бота на основе импортированного класса, передавая
// в качестве аргумента строку с уникальным токеном, который
// получили ранее в BotFather
const bot = new Bot(process.env.BOT_API_KEY);

const fs = require("fs");

const schedule = require("node-schedule");
// Запускаем бота
bot.start();

let chatId = "-1002544218495"; // Замените на ID чата
const message = "Это тестовое сообщение от бота!";
const calendarPath = "calendar.json";

bot.command("start", async (ctx) => {
  const startKeyboard = new Keyboard().text("Запланировать митап").resized();

  await ctx.reply(
    "Привет!",
    { reply_markup: startKeyboard }
  );
  console.log("ctx.chat.id", ctx.chat.id);
});

bot.hears(["Запланировать митап"], async (ctx) => {
  await ctx.reply(`Введите дату и время в формате: DD.MM.YYYY HH.MM`);
});

bot.on("message", async (ctx) => {


    // const stickerId = 'CAACAgIAAxkBAAEYxY9hQMT6umJxCEzi9LMa3I96F10zPQACWgEAAkgfiV-Dc03mMkC89ysE'; // Пример ID стикера
    ctx.replyWithAnimation('CgACAgQAAxkBAAIBDWftOxDsR53yqmU-lV7bTsnYqmvpAAIBAwACkjoFU8sQ41jq3iuhNgQ'); // Отправка стикера

    
    console.log('ctx',ctx.message)
  const dateTime = ctx.message.text; // Считываем текст сообщения
  let re =
    /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(\d{4})\s([01][0-9]|2[0-3])\:(0[0-5][0-9]|[0-5][0-9])$/;

  if (re.test(dateTime)) {
    let [date, time] = dateTime.split(" ");

    const dateToJob = new Date(
      +date.split(".")[2],
      +date.split(".")[1] - 1,
      +date.split(".")[0],
      +time.split(":")[0],
      +time.split(":")[1],
      0
    );

    fs.appendFile(
      "output.json",
      `\n${JSON.stringify({
        date: date,
        time: time,
      })};`,
      (err) => {
        if (err) {
          console.error("Ошибка при добавлении в файл:", err);
        } else {
          console.log("Данные были успешно добавлены в файл!");
        }
      }
    );

    const job = schedule.scheduleJob(dateToJob, function () {
      sendMessage(chatId, "Подключаемся!!!")
        .then(() => {
          console.log("Сообщение отправлено успешно!");
        })
        .catch((error) => {
          console.error("Ошибка при отправке сообщения:", error);
        });
    });

    await ctx.reply(`Установлено напоминание о митапе ${date} в ${time}`);
  } else {
    await ctx.reply("Не введена дата или введена дата в неверном формате. \nНеобходимо ввести дату в формате DD.MM.YYYY HH:MM");
  }
});

// Отправка сообщения
const sendMessage = async (chatId, message) => {
  await bot.api.sendMessage(chatId, message);
};

// Функция для чтения данных из файла JSON
function readJsonFile(calendarPath, isJSON) {
  return new Promise((resolve, reject) => {
    fs.readFile(calendarPath, "utf8", (err, data) => {
      if (err) {
        return reject(err); // Если произошла ошибка, отклоняем промис
      }
      try {
        let dateOnFile;
        if (isJSON) {
          dateOnFile = JSON.parse(data); // Преобразуем JSON-строку в объект
        } else {
          dateOnFile = data;
        }
        resolve(dateOnFile); // Возвращаем объект
      } catch (parseError) {
        reject(parseError); // Если произошла ошибка разбора JSON, отклоняем промис
      }
    });
  });
}

const executeTask = () => {
  readJsonFile(calendarPath, true)
    .then((data) => {
        
    let currMonth = parseInt(new Date().getMonth() + 1),
            currDate =  new Date().getDate(),
            currMonthInCalendar = data.months.filter(el=>el.month ===  parseInt(new Date().getMonth() + 1))
        
        if(currMonthInCalendar[0].days.split(',').filter(el=>parseInt(el)===currDate).length){
            console.log('Нерабочий день!');
            return;
        }
        // Здесь вы можете работать с данными
      sendMessage(chatId, new Date().toISOString())
        .then(() => {
          console.log("Сообщение отправлено успешно!");
        })
        .catch((error) => {
          console.error("Ошибка при отправке сообщения:", error);
        });
    })
    .catch((error) => {
      console.error("Ошибка при чтении файла:", error);
    });

  console.log("Задача выполнена в", new Date().toLocaleString());
};

const rule = new schedule.RecurrenceRule();
rule.tz = "Europe/Moscow";
rule.hour = 11;
rule.minute = 30;
const job = schedule.scheduleJob(rule, () => {
  executeTask();
});

readJsonFile("output.json", false)
  .then((data) => {
    // Здесь вы можете работать с данными
    let planeMeetingDate = data
      .replace("\n", "")
      .split(";")
      .filter((el) => !!el);

    planeMeetingDate.forEach((el) => {
      let { date, time } = JSON.parse(el);

      const dateToJob = new Date(
        +date.split(".")[2],
        +date.split(".")[1] - 1,
        +date.split(".")[0],
        +time.split(":")[0],
        +time.split(":")[1],
        0
      );
      const job = schedule.scheduleJob(dateToJob, function () {
        executeTask();
        console.log("Задача создана");
      });
    });
  })
  .catch((error) => {
    console.error("Ошибка при чтении файла:", error);
  });
