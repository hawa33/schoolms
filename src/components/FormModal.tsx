"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState, useRef } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";

import {
  deleteClass,
  deleteExam,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
  // TODO: Import other delete actions here
} from "@/lib/actions";

// Dynamic form import factory
const dynamicFormImport = (name: string) =>
  dynamic(() => import(`./forms/${name}Form`), {
    loading: () => <h1>Loading...</h1>,
  });

// Lazy loaded forms
const forms: Record<string, any> = {
  subject: dynamicFormImport("Subject"),
  class: dynamicFormImport("Class"),
  teacher: dynamicFormImport("Teacher"),
  student: dynamicFormImport("Student"),
  exam: dynamicFormImport("Exam"),
  // TODO: Add other forms here
};

// Delete action map
const deleteActionMap: Partial<Record<string, any>> = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  // TODO: Add other delete actions here
};

// Delete Form Component
const DeleteForm = ({
  table,
  id,
  onSuccess,
}: {
  table: string;
  id: string | number;
  onSuccess: () => void;
}) => {
  const deleteAction = deleteActionMap[table];
  const [state, formAction] = useFormState(
    deleteAction ?? (() => ({ success: false, error: true })),
    { success: false, error: false }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`${table} has been deleted!`);
      onSuccess();
      router.refresh();
    }
  }, [state, router, table, onSuccess]);

  if (!deleteAction) {
    return <div className="text-center text-red-500">Delete action not implemented for {table}.</div>;
  }

  return (
    <form action={formAction} className="p-4 flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <span className="text-center font-medium">
        All data will be lost. Are you sure you want to delete this {table}?
      </span>
      <button className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center">
        Delete
      </button>
    </form>
  );
};

// Modal Component
const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOutsideClick}
      className="w-screen h-screen fixed left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center"
    >
      <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
        {children}
        <div className="absolute top-4 right-4 cursor-pointer" onClick={onClose}>
          <Image src="/close.png" alt="Close" width={14} height={14} />
        </div>
      </div>
    </div>
  );
};

// Main FormModal
const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const [open, setOpen] = useState(false);

  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : "bg-lamaPurple";

  const handleClose = () => setOpen(false);

  const renderForm = () => {
    if (type === "delete" && id) {
      return <DeleteForm table={table} id={id} onSuccess={handleClose} />;
    }

    const FormComponent = forms[table];
    if (!FormComponent) {
      return <div className="text-center text-red-500">Form not implemented for {table}.</div>;
    }

    return (
      <FormComponent
        type={type}
        data={data}
        setOpen={setOpen}
        relatedData={relatedData}
      />
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt={type} width={16} height={16} />
      </button>
      {open && <Modal onClose={handleClose}>{renderForm()}</Modal>}
    </>
  );
};

export default FormModal;
