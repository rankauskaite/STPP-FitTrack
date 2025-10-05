# FitTrack – sporto treniruočių planavimo ir sekimo platforma

## 1. Sprendžiamo uždavinio aprašymas

### 1.1. Sistemos paskirtis
Projekto tikslas – palengvinti sportuojančių asmenų treniruočių planavimą ir sekti jų pažangą, siekiant pagerinti sportinius rezultatus ir sveikatą.

**Veikimo principas** – platformą sudaro dvi dalys: internetinė aplikacija, kuria naudojasi sportuojantys asmenys (nariai), treneriai, administratoriai, ir aplikacijų programavimo sąsaja (API).  
Sportuojantis asmuo, prisijungęs prie platformos, mato tik savo planus ir treniruotes, gali rinktis iš trenerių siūlomų viešų planų, reitinguoti juos arba išsaugoti patikusius savo profilyje.  
Kuriant treniruotę, vartotojas gali pasirinkti jos trukmę, tipą (pvz., jėga, kardio), pratimus, pakartojimų skaičių, serijas, svorius ar kitus nustatymus.  
Susidarius treniruotę, ji išsaugoma, ir iš sukurtų treniruočių galima sudaryti mėnesio ar kito laikotarpio treniruočių planą, sudedant jas pasirinktomis dienomis (pvz., savaitės tvarkaraštis).  

Treneriai turi klientus, kuriems kuria personalizuotus planus – klientas negali koreguoti tokio plano, bet gali pridėti komentarus ar pastebėjimus prie treniruočių ar konkrečių pratimų.  
Administratoriai tvirtina viešai skelbiamus trenerių planus, prižiūri turinį, šalina naudotojus ar netinkamus planus, užtikrindami platformos kokybę ir saugumą.

### 1.2. Funkciniai reikalavimai

#### Neregistruotas naudotojas
- Peržiūrėti platformos reprezentacinį puslapį
- Prisijungti prie internetinės aplikacijos

#### Registruotas naudotojas
1. Atsijungti nuo aplikacijos
2. Prisijungti / užsiregistruoti prie platformos
3. Peržiūrėti savo treniruočių planus ir treniruotes
4. Kurti treniruotę:
   - Pasirinkti trukmę, tipą (pvz., jėga, ištvermė)
   - Pridėti pratimus, pakartojimų skaičių, serijas, svorius
   - Išsaugoti treniruotę
5. Sudaryti treniruočių planą (pvz., mėnesio planas)
6. Išsaugoti ir peržiūrėti planus
7. Rašyti komentarus ar pastebėjimus
8. Peržiūrėti viešus trenerių planus (tik skaitymui)
9. Išsaugoti viešus planus
10. Reitinguoti viešus planus

#### Treneris
1. Kurti personalizuotus planus klientams (klientas gali komentuoti, bet ne redaguoti)
2. Kurti viešus planus (matomus po administratoriaus patvirtinimo)
3. Peržiūrėti klientų planus ir komentarus
4. Valdyti klientų sąrašą (pridėti/šalinti)
5. Matyti narių išsaugotus planus ir reitingus

#### Administratorius
1. Patvirtinti naudotojų (ir trenerių) registracijas
2. Patvirtinti viešus planus
3. Šalinti naudotojus
4. Šalinti netinkamus planus, treniruotes ar komentarus
5. Peržiūrėti visą turinį moderavimui

### Hierarchiniai objektai ir ryšiai
1. **TrainingPlan** – treniruočių planas (pavadinimas, trukmė savaitėmis, tipas, vartotojo ID).  
   *Ryšys:* planas turi kelias treniruotes (vienas su daugeliu).  
2. **Workout** – treniruotė (data, tipas, trukmė, kalorijos, plano ID).  
   *Ryšys:* treniruotė priklauso planui ir apima pratimus.  
3. **Exercise** – pratimas (pavadinimas, serijos, pakartojimai, svoris, treniruotės ID).  
   *Ryšys:* pratimas priklauso treniruotei (vienas su daugeliu).  

**Hierarchija:** Treniruotės planas → Treniruotė → Pratimas

### 1.3. Pasirinktų technologijų aprašymas

- **Backend:** ASP.NET Core 8.0 – duomenų logika, API, autentifikacija, diegimas Azure
- **Duomenų bazė:** PostgreSQL – relacinė struktūra, hierarchijos palaikymas, Azure palaikymas
- **Autentifikacija:** JWT (15 min) + Refresh Token (7 d.) – saugo duomenų bazėje
- **Frontend:** React.js (Vite) – UI, grafikai (Recharts), kalendorius (FullCalendar), API (Axios), stiliai (Tailwind CSS)
- **Debesų technologijos:** Azure App Service (backend), Vercel (frontend), Azure PostgreSQL (DB), GitHub automatinis atnaujinimas
