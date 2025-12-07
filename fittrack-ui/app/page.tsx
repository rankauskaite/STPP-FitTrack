import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Workouts from "@/components/Workouts";
import TrainingPlans from "@/components/TopRatedTrainingPlans";
import WhyChooseUs from "@/components/WhyChooseUs";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Workouts />
      <WhyChooseUs />
      <TrainingPlans />
      <Footer />
    </div>
  );
}
