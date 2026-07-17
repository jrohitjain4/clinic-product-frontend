/* eslint-disable */
// Doctor Therapy Panel — uses exact same components as admin therapy module
// Tab navigation is in the sidebar; this component just renders the right one

import ConsultationList from "../therapy-modules/ConsultationList";
import SessionsList from "../therapy-modules/SessionsList";
import TherapyAppointments from "../therapy-modules/TherapyAppointments";

interface Props {
  tab?: "appointments" | "consultations" | "sessions";
}

const DoctorTherapy = ({ tab = "appointments" }: Props) => {
  if (tab === "consultations") return <ConsultationList />;
  if (tab === "sessions") return <SessionsList />;
  return <TherapyAppointments />;
};

export default DoctorTherapy;
