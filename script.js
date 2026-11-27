(() => {
  "use strict";

  // Die Uhrzeit stammt aus der bisherigen Seite und ist noch vorläufig.
  // +02:00 entspricht der deutschen Sommerzeit am 3. September 2027.
  const wedding = {
    start: new Date("2027-09-03T15:00:00+02:00"),
    end: new Date("2027-09-04T00:00:00+02:00"),
    title: "Hochzeit Céline & Justin",
    location: "Q-Stall, Pulheim",
    description: "Wir freuen uns auf euch! Die Einladung mit allen Details folgt. " +
      "Die Uhrzeit ist vorläufig und wird mit der Einladung bestätigt.",
    uid: "celine-justin-20270903@example.com"
  };

  const fields = ["days", "hours", "minutes", "seconds"]
    .map((id) => document.getElementById(id));
  const countdown = document.getElementById("countdown");
  const countdownStatus = document.getElementById("countdownStatus");
  let countdownInterval;

  function updateCountdown() {
    const remaining = Math.max(0, wedding.start.getTime() - Date.now());
    const seconds = Math.floor(remaining / 1000);
    const values = [
      Math.floor(seconds / 86400),
      Math.floor(seconds / 3600) % 24,
      Math.floor(seconds / 60) % 60,
      seconds % 60
    ];

    fields.forEach((field, index) => {
      field.textContent = String(values[index]).padStart(2, "0");
    });

    if (remaining === 0) {
      window.clearInterval(countdownInterval);
      if (countdownStatus) {
        countdownStatus.textContent = Date.now() < wedding.end.getTime()
          ? "Unser großer Tag ist da!"
          : "Ein Tag voller Liebe. Für immer in unseren Herzen.";
        countdownStatus.hidden = false;
      }
      return false;
    }
    return true;
  }

  // Kein sekündliches Vorlesen durch Screenreader; nur die Abschlussnachricht
  // steht in der separaten Statusregion. Ohne JavaScript bleibt das Datum lesbar.
  if (fields.every(Boolean)) {
    if (countdown) {
      countdown.hidden = false;
      countdown.setAttribute("role", "timer");
      countdown.setAttribute("aria-live", "off");
    }
    if (updateCountdown()) {
      countdownInterval = window.setInterval(updateCountdown, 1000);
    }
  }

  function calendarTimestamp(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }

  function escapeCalendarText(value) {
    return value.replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  }

  // RFC 5545: maximal 75 UTF-8-Bytes je Zeile, ohne ein Zeichen zu zerteilen.
  function foldCalendarLine(line) {
    const encoder = new TextEncoder();
    let folded = "";
    let byteCount = 0;
    for (const character of line) {
      const size = encoder.encode(character).length;
      if (byteCount + size > 75) {
        folded += "\r\n ";
        byteCount = 1;
      }
      folded += character;
      byteCount += size;
    }
    return folded;
  }

  function createCalendar() {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Celine und Justin//Save the Date//DE",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:" + wedding.uid,
      "DTSTAMP:" + calendarTimestamp(new Date()),
      "DTSTART:" + calendarTimestamp(wedding.start),
      "DTEND:" + calendarTimestamp(wedding.end),
      "SUMMARY:" + escapeCalendarText(wedding.title),
      "LOCATION:" + escapeCalendarText(wedding.location),
      "DESCRIPTION:" + escapeCalendarText(wedding.description),
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    return lines.map(foldCalendarLine).join("\r\n") + "\r\n";
  }

  const calendarButton = document.getElementById("calendarButton");
  if (calendarButton) {
    calendarButton.addEventListener("click", (event) => {
      // Bei fehlender Browserunterstützung bleibt der normale .ics-Link aktiv.
      if (!window.Blob || !window.URL || !window.URL.createObjectURL || !window.TextEncoder) return;

      const calendar = new Blob([createCalendar()], {
        type: "text/calendar;charset=utf-8"
      });
      const url = URL.createObjectURL(calendar);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = "Celine-und-Justin-03-09-2027.ics";
      document.body.appendChild(downloadLink);
      event.preventDefault();
      downloadLink.click();
      downloadLink.remove();

      // Den Download erst anstoßen, dann den temporären Speicher freigeben.
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    });
  }
})();
