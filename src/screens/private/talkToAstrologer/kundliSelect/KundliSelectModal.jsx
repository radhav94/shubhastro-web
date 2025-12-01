import React, { useState } from "react";
import { createPortal } from "react-dom";
import styles from "./KundliSelectModal.module.scss";
import { IoClose } from "react-icons/io5";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

import {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
} from "../../../../services/appServices/kundliServicesNew";
import LocationSearch from "../../../../utils/location/locationSearch";

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

const monthMap = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

const initialForm = {
  name: "",
  gender: "",
  day: "",
  month: "",
  year: "",
  hour: "",
  minute: "",
  second: "",
  place: "",
  lat: null,
  lon: null,
};

const KundliSelectModal = ({ isOpen, onClose, onSelect }) => {
  const role = localStorage.getItem("shubhtalk_role");

  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  const { data, isLoading } = useGetAllKundlisQuery(undefined, {
    skip: !token || !isOpen,
  });

  const [createKundli] = useCreateKundliMutation();
  const kundlis = data?.data || [];

  const [activeTab, setActiveTab] = useState("saved");
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>
        <button className={styles.closeBtn} onClick={onClose}>
          <IoClose size={22} />
        </button>

        <div className={styles.tabs}>
          <button
            className={activeTab === "saved" ? styles.activeTab : ""}
            onClick={() => setActiveTab("saved")}
          >
            Saved Kundli
          </button>

          <button
            className={activeTab === "create" ? styles.activeTab : ""}
            onClick={() => setActiveTab("create")}
          >
            Create Kundli
          </button>
        </div>

        {/* SAVED KUNDLIS */}
        {activeTab === "saved" && (
          <>
            {isLoading ? (
              <PrimaryLoader />
            ) : kundlis.length > 0 ? (
              <div className={styles.kundliList}>
                {kundlis.map((k) => (
                  <div
                    key={k._id}
                    className={styles.kundliItem}
                    onClick={() => onSelect(k)}
                  >
                    <div className={styles.avatar}>{k.name.charAt(0)}</div>

                    <div>
                      <p className={styles.name}>
                        {k.name} ({k.gender})
                      </p>
                      <p className={styles.dob}>
                        {k.day} {k.month}, {k.year} • {k.hour}:{k.min}
                      </p>
                      <p className={styles.place}>{k.place}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No saved kundlis found.</p>
            )}
          </>
        )}

        {/* CREATE KUNDLI */}
        {activeTab === "create" && (
          <form
            className={styles.createForm}
            onSubmit={async (e) => {
              e.preventDefault();
              setCreating(true);

              try {
                const payload = {
                  name: form.name,
                  gender: form.gender.toLowerCase(),
                  day: Number(form.day),
                  month: monthMap[form.month],
                  year: Number(form.year),
                  hour: Number(form.hour),
                  min: Number(form.minute),
                  second: Number(form.second),
                  place: form.place,
                  lat: Number(form.lat),
                  lon: Number(form.lon),
                  tzone: 5.5,
                };

                const res = await createKundli(payload).unwrap();
                onSelect(res.data);
                setForm(initialForm);
              } catch (err) {
                console.log("Create failed", err);
              } finally {
                setCreating(false);
              }
            }}
          >
            <input
              placeholder="Name"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <select
              name="gender"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              required
            >
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <div className={styles.row}>
              <select
                name="day"
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                required
              >
                <option value="">Day</option>
                {days.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>

              <select
                name="month"
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                required
              >
                <option value="">Month</option>
                {months.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>

              <select
                name="year"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                required
              >
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Time */}
            <div className={styles.row}>
              <select
                name="hour"
                value={form.hour}
                onChange={(e) => setForm({ ...form, hour: e.target.value })}
                required
              >
                <option value="">Hour</option>
                {hours.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>

              <select
                name="minute"
                value={form.minute}
                onChange={(e) => setForm({ ...form, minute: e.target.value })}
                required
              >
                <option value="">Minute</option>
                {minutes.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>

              <select
                name="second"
                value={form.second}
                onChange={(e) => setForm({ ...form, second: e.target.value })}
                required
              >
                <option value="">Second</option>
                {minutes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className={styles.locationWrapper}>
              <LocationSearch
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
                onPlaceSelect={(place) =>
                  setForm({
                    ...form,
                    place: place.address,
                    lat: place.lat,
                    lon: place.lng,
                  })
                }
              />
            </div>

            <button className={styles.submitBtn} disabled={creating}>
              {creating ? "Creating..." : "Create Kundli"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default KundliSelectModal;
