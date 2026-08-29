const fs = require('fs');
const path = require('path');

const cats = {
  'NOCO WATCH': [
    ['Was ist NOCO WATCH?', 'NOCO WATCH ist dein lokaler Streamingdienst. Filme und Serien liegen auf dem Windows-PC und werden über das WLAN gestreamt.'],
    ['Wie funktioniert NOCO WATCH?', 'Der PC ist der Server. iPhone, Browser und die Windows-App greifen über die API auf Bibliothek und Streams zu.'],
    ['Was sind NOCO Originals?', 'NOCO Originals sind exklusive Titel, die speziell für NOCO WATCH produziert oder aufbereitet wurden.'],
    ['Wo laufen die Filme?', 'Die Filmdateien bleiben auf dem Windows-PC. Clients laden nur Metadaten und streamen bei Bedarf.'],
    ['Brauche ich Internet?', 'Für das lokale Streaming reicht das gleiche WLAN. Öffentliches Internet ist nicht nötig.'],
    ['Wie starte ich den Server?', 'Starte die NOCO WATCH Windows-App oder führe npm start im Projektordner aus.'],
    ['Was ist die Steuerzentrale?', 'Dort siehst du Serverstatus, LAN-Adresse und Systeminfos deines NOCO WATCH Servers.'],
    ['Kann ich vom iPhone schauen?', 'Ja. Öffne im gleichen WLAN die Server-URL oder die Mobile Web UI unter /web/.'],
    ['Gibt es eine App Store App?', 'V1 nutzt Browser und Windows-App. Eine IPA kann später dieselbe API verwenden.'],
    ['Wo liegen die Metadaten?', 'In metadata/videos.json auf dem PC. Die Clients speichern keine eigene Filmdatenbank.'],
    ['Was ist ein HTML Movie?', 'Ein HTML-Film ist ein interaktiver Kurzfilm als Webseite, ausgeliefert über /api/content/:id.'],
    ['Was ist ein Video-Stream?', 'MP4-Dateien werden über /api/stream/:id mit HTTP Range Requests gestreamt.'],
    ['Wie funktioniert der Player?', 'Der NocoPlayer zeigt Intro, Film, Untertitel, Timeline und Vollbild – optimiert für Desktop und Mobile.'],
    ['Kann ich Untertitel nutzen?', 'Ja, wenn für den Titel WebVTT-Untertitel hinterlegt sind. Im Player über CC aktivieren.'],
    ['Was bedeutet Server online?', 'Der Express-Server antwortet und die Bibliothek ist erreichbar.'],
    ['Warum muss ich im WLAN sein?', 'Weil der Server nur im privaten Netzwerk erreichbar ist – nicht öffentlich im Internet.'],
    ['Welche Clients gibt es?', 'Windows Electron-App, Browser auf dem PC, Mobile Web und später eine mögliche IPA.'],
    ['Ist NOCO WATCH kostenlos?', 'Es ist dein eigenes lokales System. Es speichert und streamt deine eigenen Inhalte.'],
    ['Kann ich eigene Filme hinzufügen?', 'Ja. Datei nach media/ legen und Eintrag in metadata/videos.json ergänzen.'],
    ['Was ist die Mobile Web Version?', 'Ein Frontend ohne Mediendateien, das dynamisch den NOCO WATCH Server abfragt.'],
  ],
  Filme: [
    ['Welche Filme gibt es?', 'In deiner Bibliothek findest du NOCO Originals wie Magic World, The Jungle Run, NOCO Future und Josies Jahre.'],
    ['Was ist der längste Film?', 'Aktuell ist Josies Jahre der längste Titel in der Bibliothek.'],
    ['Welche Filme sind Fantasy?', 'Die Magic-World-Episoden sind Fantasy (mit Adventure und Animation).'],
    ['Welche Filme sind Animation?', 'Die Magic-World-Reihe ist als Animation gekennzeichnet.'],
    ['Welche Filme sind Sci-Fi?', 'Die NOCO-Future-Episoden sind Science-Fiction.'],
    ['Welche Filme sind Adventure?', 'The Jungle Run und Teile von Magic World / NOCO Future tragen Adventure.'],
    ['Welche Filme sind Mystery?', 'The Jungle Run und ausgewählte NOCO-Future-Folgen enthalten Mystery.'],
    ['Welche Filme sind Drama?', 'Josies Jahre ist als Drama hinterlegt.'],
    ['Zeig mir kurze Filme.', 'Die HTML-Originals dauern meist rund 1:40–1:50 – ideal für etwas Kurzes.'],
    ['Zeig mir lange Filme.', 'Josies Jahre ist der längste Titel und eignet sich für eine längere Session.'],
    ['Was kann ich heute schauen?', 'Starte mit einem NOCO Original – z. B. Magic World oder The Jungle Run.'],
    ['Welche Titel sind neu?', 'Die jüngsten Einträge findest du unter Neu bei NOCO auf der Startseite.'],
    ['Welche Titel sind featured?', 'Die HTML-Serien The Jungle Run, Magic World und NOCO Future sind als Highlights markiert.'],
    ['Gibt es persönliche Filme?', 'Ja – Josies Jahre ist ein persönlicher Erinnerungsfilm.'],
    ['Wie viele Filme gibt es?', 'Die aktuelle Anzahl siehst du in der Bibliothek bzw. in der Steuerzentrale.'],
    ['Welche Serien gibt es?', 'Magic World, The Jungle Run und NOCO Future.'],
    ['Was ist ein guter Einstieg?', 'Magic World: The Hidden Door oder The Jungle Run Episode 1.'],
    ['Empfiehl etwas Spannendes.', 'The Jungle Run oder NOCO Future: The Escape liefern Tempo und Spannung.'],
    ['Empfiehl etwas Magisches.', 'Magic World – besonders The Hidden Door und The Last Spell.'],
    ['Empfiehl etwas Futuristisches.', 'NOCO Future, beginnend mit First Contact.'],
  ],
  'Magic World': [
    ['Was ist Magic World?', 'Magic World ist eine Fantasy-Animationsreihe von NOCO Originals rund um Magie, Portale und ein Kristallkönigreich.'],
    ['Wie viele Episoden hat Magic World?', 'Magic World hat drei Episoden.'],
    ['Welche Episode kommt zuerst?', 'Episode 1: The Hidden Door.'],
    ['Was passiert in Episode 1?', 'Eine leuchtende Tür führt in einen magischen Wald.'],
    ['Was passiert in Episode 2?', 'Das Kristallkönigreich verliert Energie – ein Funke bringt Licht zurück.'],
    ['Was passiert in Episode 3?', 'Mit dem letzten Zauber kehrt das Licht zurück und ein Funke wird zum Stern.'],
    ['Ist Magic World ein NOCO Original?', 'Ja, die gesamte Reihe ist ein NOCO Original.'],
    ['Welche Genres hat Magic World?', 'Fantasy, Adventure und Animation.'],
    ['Gibt es Untertitel für Magic World?', 'Für Episode 1 sind deutsche und englische Untertitel verfügbar.'],
    ['Wonach suche ich für Magic World?', 'Stichworte wie Magie, Zauber, Fantasy, Wald oder Magic.'],
  ],
  'The Jungle Run': [
    ['Was ist The Jungle Run?', 'Eine Abenteuer-Mystery-Reihe im Regenwald mit Tempel, Kristall und Portal.'],
    ['Wie viele Episoden hat The Jungle Run?', 'Drei Episoden.'],
    ['Womit soll ich starten?', 'Mit The Jungle Run Episode 1.'],
    ['Gibt es Action?', 'Ja – Jagd, Tempel und Portalsequenzen.'],
    ['Welche Genres hat The Jungle Run?', 'Adventure und Mystery.'],
  ],
  'NOCO Future': [
    ['Was ist NOCO Future?', 'Eine Sci-Fi-Reihe über Signale, Raumschiffe und Erstkontakt.'],
    ['Wie viele Episoden hat NOCO Future?', 'Vier Episoden.'],
    ['Womit startet NOCO Future?', 'First Contact.'],
    ['Gibt es Weltraum?', 'Ja – Signale, Raumschiffe, Strukturen und Galaxien.'],
    ['Welche Genres hat NOCO Future?', 'Sci-Fi, teils Adventure oder Mystery.'],
  ],
  Technik: [
    ['Wie funktioniert Streaming?', 'Der Browser oder die App fordert Byte-Bereiche per HTTP Range vom Server an.'],
    ['Was ist HTTP Range?', 'Damit kann der Player gezielt Teile einer MP4-Datei laden – wichtig für Scrubbing.'],
    ['Wo läuft der Server?', 'Auf deinem Windows-PC, standardmäßig Port 3000.'],
    ['Welche API liefert die Bibliothek?', 'GET /api/videos und GET /api/recommendations.'],
    ['Wie lade ich einen Film?', 'Erst Metadaten, Cover und Detail – der Stream erst beim Abspielen.'],
    ['Was ist CORS?', 'CORS erlaubt dem Frontend (z. B. GitHub Pages) den API-Zugriff vom Browser.'],
    ['Was ist Mixed Content?', 'HTTPS-Seiten dürfen HTTP-APIs oft nicht laden. Deshalb gibt es /web/ über HTTP.'],
    ['Warum Fullscreen?', 'Damit nur Player und Controls sichtbar sind – ohne Browser-Chrome der Seite.'],
    ['Unterstützt iPhone Safari Streaming?', 'Ja im gleichen WLAN über http://DEINE-IP:3000 oder /web/.'],
    ['Was speichert localStorage?', 'Optional die Serveradresse und Einstellungen – keine Filmdateien.'],
    ['Was ist die Firewall-Regel?', 'Port 3000 sollte nur für private Netzwerke freigegeben sein.'],
    ['Kann ich die Server-IP ändern?', 'Ja in den Einstellungen der Mobile Web UI oder über die LAN-Adresse in der Steuerzentrale.'],
    ['Was ist ein Cover?', 'Ein HTML-Poster, das über /api/cover/:id ausgeliefert wird.'],
    ['Was ist ein Intro?', 'Das NOCO-Originals-Intro vor ausgewählten Titeln.'],
    ['Wie stoppe ich den Server?', 'Prozess beenden (Ctrl+C) oder die Windows-App schließen.'],
  ],
  Empfehlungen: [
    ['Was kann ich schauen?', 'Probiere ein NOCO Original – Magic World, Jungle Run oder NOCO Future.'],
    ['Ich möchte etwas Spannendes.', 'The Jungle Run oder NOCO Future: The Escape.'],
    ['Ich möchte Fantasy.', 'Magic World ist die Fantasy-Reihe.'],
    ['Ich möchte etwas Kurzes.', 'Die HTML-Episoden dauern meist unter zwei Minuten.'],
    ['Ich möchte einen NOCO Original.', 'Alle HTML-Serien und Josies Jahre sind als Original markiert.'],
    ['Ich will Magie.', 'Magic World – Stichworte Magie, Zauber, Fantasy.'],
    ['Ich will Sci-Fi.', 'NOCO Future von First Contact bis Beyond.'],
    ['Ich will Abenteuer.', 'The Jungle Run oder Magic World.'],
    ['Ich will etwas Persönliches.', 'Josies Jahre.'],
    ['Ich will Mystery.', 'The Jungle Run und ausgewählte Future-Folgen.'],
    ['Zeig mir Animation.', 'Magic World.'],
    ['Etwas Leichtes zum Einstieg.', 'Magic World: The Hidden Door.'],
    ['Etwas Episches.', 'NOCO Future: Beyond oder Magic World: The Last Spell.'],
    ['Für zwischendurch.', 'Eine einzelne HTML-Episode aus Jungle Run oder Magic World.'],
    ['Für den Abend.', 'Eine komplette Reihe hintereinander – z. B. Magic World 1–3.'],
  ],
  Allgemein: [
    ['Hallo', 'Hallo! Frag mich nach Filmen, Genres oder wie NOCO WATCH funktioniert.'],
    ['Hi', 'Hi! Wonach suchst du – Fantasy, Sci-Fi oder Abenteuer?'],
    ['Danke', 'Gerne. Viel Spaß beim Streamen.'],
    ['Hilfe', 'Du kannst nach Filmen, Genres, Reihen oder Technik fragen – oder Stichworte wie Magie, kurz, Original.'],
    ['Wer bist du?', 'Ich bin Frag NOCO – die lokale Empfehlungs-Hilfe von NOCO WATCH.'],
    ['Was kannst du?', 'Fragen beantworten, Stichworte erkennen und passende Titel aus deiner Bibliothek vorschlagen.'],
    ['Wie suche ich richtig?', 'Nutze die Suche mit Stichworten wie Magie, Jungle oder Sci-Fi – auch kleine Tippfehler gehen oft.'],
    ['Was sind Genres?', 'Genres kommen aus den Filmdaten, z. B. Fantasy, Adventure, Sci-Fi, Drama, Animation, Mystery.'],
    ['Was ist die Startseite?', 'Ein ruhiger Einstieg mit Hero und wenigen horizontalen Reihen.'],
    ['Wie öffne ich Details?', 'Tippe auf eine Filmkarte – erst Infos, dann Abspielen.'],
    ['Kann ich pausieren?', 'Ja – Klick oder Tap auf die freie Playerfläche schaltet Play/Pause.'],
    ['Gibt es Dark Mode?', 'NOCO WATCH ist von Grund auf dunkel und cinematic gestaltet.'],
    ['Ist das Netflix?', 'Nein – NOCO WATCH ist dein eigenes lokales Streaming-System.'],
    ['Kann ich offline schauen?', 'Nur solange der PC-Server erreichbar ist (gleiches Netz).'],
    ['Was passiert ohne Server?', 'Die Oberfläche zeigt, dass der Server nicht erreichbar ist – Filme wurden nicht gelöscht.'],
    ['Wie aktualisiere ich die Bibliothek?', 'videos.json und media/ auf dem PC anpassen und Server neu laden bzw. neu starten.'],
    ['Was bedeutet available?', 'Die Datei wurde auf dem PC gefunden und kann gestreamt werden.'],
    ['Gibt es Continue Watching?', 'Vorbereitet in der API – Fortschritt kann später ergänzt werden.'],
    ['Welche Sprache hat die UI?', 'Deutsch, mit englischen Originaltiteln wo sinnvoll.'],
    ['Wie erweitere ich Frag NOCO?', 'Neue Einträge in data/noco-questions.json ergänzen.'],
  ],
};

const seeds = [
  'Fantasy',
  'Adventure',
  'Sci-Fi',
  'Mystery',
  'Drama',
  'Animation',
  'Magic World',
  'Jungle',
  'NOCO Future',
  'Originals',
];

const out = [];
for (const [category, items] of Object.entries(cats)) {
  for (const [q, a] of items) {
    const keywords = q
      .toLowerCase()
      .split(/[^a-z0-9äöüß]+/i)
      .filter((w) => w.length > 2);
    out.push({
      id: `q-${out.length + 1}`,
      category,
      question: q,
      answer: a,
      keywords: [...new Set(keywords)],
    });
  }
}

for (const s of seeds) {
  out.push({
    id: `q-${out.length + 1}`,
    category: 'Empfehlungen',
    question: `Empfiehl mir ${s}`,
    answer: `Hier sind passende Titel rund um ${s} aus deiner lokalen Bibliothek.`,
    keywords: [s.toLowerCase(), 'empfehl', 'schauen'],
  });
  out.push({
    id: `q-${out.length + 1}`,
    category: 'Filme',
    question: `Gibt es etwas mit ${s}?`,
    answer: `Ja – filtere nach ${s} in Genres oder Suche.`,
    keywords: [s.toLowerCase(), 'film', 'genre'],
  });
}

const dir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dir, { recursive: true });
const target = path.join(dir, 'noco-questions.json');
fs.writeFileSync(target, JSON.stringify({ version: 1, questions: out }, null, 2));
console.log('Wrote', out.length, 'questions to', target);
