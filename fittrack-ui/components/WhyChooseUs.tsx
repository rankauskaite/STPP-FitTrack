import { Dumbbell, Target, PencilRuler, MessageSquare } from "lucide-react";
import * as motion from "motion/react-client";

export default function WhyChooseUs() {
  const features = [
    {
      icon: PencilRuler,
      title: "Individualūs treniruočių planai",
      description:
        "Kurk savo treniruotes, tvarkaraščius ir planus pagal tai, kas tau labiausiai tinka.",
    },
    {
      icon: Dumbbell,
      title: "Profesionalūs patarimai",
      description:
        "Mūsų trenerių rekomendacijos padeda pasiekti rezultatų greičiau ir saugiau.",
    },
    {
      icon: Target,
      title: "Pilna kontrolė tavo progresui",
      description:
        "Valdyk savo tikslus, sek pažangą ir koreguok planus bet kuriuo metu.",
    },
    {
      icon: MessageSquare,
      title: "Vertinimai ir komentarai",
      description:
        "Dalinkis treniruotėmis, gauk grįžtamąjį ryšį ir komentuok kitų vartotojų planus.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section heading */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-black font-heading mb-4 text-foreground"
          >
            Kodėl verta rinktis <span className="text-primary">FitTrack</span>?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            FitTrack suteikia tau visus įrankius, reikalingus kurti, naudoti ir dalintis efektyviomis treniruotėmis.
          </motion.p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              className="group text-center"
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: index * 0.12,
              }}
              whileHover={{ scale: 1.03 }}
            >
              <motion.div
                className="w-16 h-16 rounded-full bg-primary/20 inline-flex text-primary items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 mb-6"
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: index * 0.18,
                }}
              >
                <feature.icon className="w-8 h-8" />
              </motion.div>

              <motion.h3
                className="text-xl font-bold font-heading mb-4 text-foreground"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: index * 0.14,
                }}
              >
                {feature.title}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: index * 0.14,
                }}
                className="text-muted-foreground leading-relaxed"
              >
                {feature.description}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}