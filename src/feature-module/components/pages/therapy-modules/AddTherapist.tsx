import React from "react";
import DoctorFormPage from "../clinic-modules/doctor-form/doctorFormPage";

const AddTherapist = () => {
  return <DoctorFormPage mode="add" defaultDoctorType="therapist" disableDoctorTypeChange={true} />;
};

export default AddTherapist;
