import { useState, useEffect } from "react";
import { FiX, FiEdit2, FiTrash2, FiUser } from "react-icons/fi";
import {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";
import styles from "./AddressesTab.module.scss";

const EMPTY_ADDR = { name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" };

const AddressesTab = () => {
  const { data: addressData, isLoading } = useGetAddressesQuery();
  const [addAddress, { isLoading: isAdding }] = useAddAddressMutation();
  const [updateAddressApi, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddr, setNewAddr] = useState(EMPTY_ADDR);
  const [addrErrors, setAddrErrors] = useState({});

  const raw = addressData?.data?.addresses || addressData?.data || [];
  const addressList = Array.isArray(raw) ? raw : [];

  useEffect(() => {
    if (addressList.length > 0 && !selectedAddress) {
      const def = addressList.find((a) => a.isDefault) || addressList[0];
      setSelectedAddress(def?._id || def?.id);
    }
  }, [addressList, selectedAddress]);

  const validateAddress = () => {
    const errs = {};
    if (!newAddr.name.trim()) errs.name = "Name is required";
    else if (!/^[a-zA-Z\s]+$/.test(newAddr.name.trim())) errs.name = "Name must contain only letters";
    if (!newAddr.phone.trim()) errs.phone = "Phone is required";
    else if (!/^\d{10}$/.test(newAddr.phone.trim())) errs.phone = "Enter a valid 10-digit phone number";
    if (!newAddr.addressLine1.trim()) errs.addressLine1 = "Address line 1 is required";
    if (!newAddr.pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(newAddr.pincode.trim())) errs.pincode = "Enter a valid 6-digit pincode";
    if (!newAddr.city.trim()) errs.city = "City is required";
    else if (!/^[a-zA-Z\s]+$/.test(newAddr.city.trim())) errs.city = "City must contain only letters";
    if (!newAddr.state.trim()) errs.state = "State is required";
    else if (!/^[a-zA-Z\s]+$/.test(newAddr.state.trim())) errs.state = "State must contain only letters";
    setAddrErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAddress = async () => {
    if (!validateAddress()) return;
    try {
      if (editingAddress) {
        const addrId = editingAddress._id || editingAddress.id;
        await updateAddressApi({ addressId: addrId, ...newAddr }).unwrap();
        Toast.success("Address updated");
      } else {
        await addAddress(newAddr).unwrap();
        Toast.success("Address added");
      }
      setShowNewAddress(false);
      setEditingAddress(null);
      setAddrErrors({});
      setNewAddr(EMPTY_ADDR);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to save address");
    }
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setNewAddr({
      name: addr.name || "", phone: addr.phone || "",
      addressLine1: addr.addressLine1 || "", addressLine2: addr.addressLine2 || "",
      city: addr.city || "", state: addr.state || "",
      pincode: addr.pincode || "", landmark: addr.landmark || "",
      type: addr.type || "home", country: addr.country || "IN",
    });
    setAddrErrors({});
    setShowNewAddress(true);
  };

  const handleDeleteAddress = async (addrId) => {
    if (!addrId) return;
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await deleteAddress({ addressId: addrId }).unwrap();
      Toast.success("Address deleted");
      if (selectedAddress === addrId) setSelectedAddress(null);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to delete address");
    }
  };

  if (isLoading) {
    return <div className={styles.wrapper}><div className={styles.empty}>Loading addresses...</div></div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.headingRow}>
        <h3 className={styles.heading}>Saved Addresses</h3>
        <button className={styles.addBtnTop} onClick={() => { setEditingAddress(null); setNewAddr(EMPTY_ADDR); setAddrErrors({}); setShowNewAddress(true); }}>
          + Add New Address
        </button>
      </div>

      {/* Address List */}
      <div className={styles.addressList}>
        {addressList.length === 0 && (
          <p style={{ textAlign: "center", color: "#aaa", padding: "16px 0" }}>No saved addresses</p>
        )}
        {addressList.map((a) => {
          const addrId = a._id || a.id;
          const addrType = a.type || "home";
          const isSelected = selectedAddress === addrId;
          return (
            <div key={addrId} className={`${styles.addressCard} ${isSelected ? styles.addressActive : ""}`} onClick={() => setSelectedAddress(addrId)}>
              <div className={styles.cardTop}>
                <span className={styles.typeBadge}>{addrType.toUpperCase()}</span>
                <input type="radio" name="address" checked={isSelected} readOnly className={styles.addressRadio} />
              </div>
              <div className={styles.cardBody}>
                <FiUser size={16} className={styles.userIcon} />
                <span className={styles.namePhone}>{a.name || addrType}{a.phone ? ` · ${a.phone}` : ""}</span>
              </div>
              <p className={styles.addressText}>
                {[a.addressLine1, a.addressLine2, a.landmark].filter(Boolean).join(", ")}
                <br />{[a.city, a.state, a.pincode].filter(Boolean).join(", ")}
              </p>
              <div className={styles.cardActions}>
                <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); openEditAddress(a); }} aria-label="Edit address"><FiEdit2 size={14} /> Edit</button>
                <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addrId); }} aria-label="Delete address"><FiTrash2 size={14} /> Delete</button>
                {!a.isDefault && <button className={styles.setDefaultBtn} onClick={(e) => { e.stopPropagation(); setSelectedAddress(addrId); }} aria-label="Set default">Set Default</button>}
              </div>
            </div>
          );
        })}
      </div>




      {/* ── Add / Edit Address Modal (same as ShubhMall product page) ── */}
      {showNewAddress && (
        <div className={styles.overlay} onClick={() => setShowNewAddress(false)}>
          <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowNewAddress(false)} aria-label="Close"><FiX /></button>
            <h2 className={styles.modalTitle}>{editingAddress ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name *</label>
                <input type="text" placeholder="Full name" className={`${styles.formInput} ${addrErrors.name ? styles.formInputError : ""}`} value={newAddr.name} onChange={(e) => { setNewAddr({ ...newAddr, name: e.target.value }); setAddrErrors({ ...addrErrors, name: "" }); }} />
                {addrErrors.name && <p className={styles.formError}>{addrErrors.name}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone *</label>
                <input type="tel" placeholder="Phone number" maxLength={10} className={`${styles.formInput} ${addrErrors.phone ? styles.formInputError : ""}`} value={newAddr.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, phone: v }); setAddrErrors({ ...addrErrors, phone: "" }); }} />
                {addrErrors.phone && <p className={styles.formError}>{addrErrors.phone}</p>}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address line 1 *</label>
              <input type="text" placeholder="Enter here" className={`${styles.formInput} ${addrErrors.addressLine1 ? styles.formInputError : ""}`} value={newAddr.addressLine1} onChange={(e) => { setNewAddr({ ...newAddr, addressLine1: e.target.value }); setAddrErrors({ ...addrErrors, addressLine1: "" }); }} />
              {addrErrors.addressLine1 && <p className={styles.formError}>{addrErrors.addressLine1}</p>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address line 2</label>
              <input type="text" placeholder="Enter here" className={styles.formInput} value={newAddr.addressLine2} onChange={(e) => setNewAddr({ ...newAddr, addressLine2: e.target.value })} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Pincode *</label>
                <input type="text" placeholder="Enter here" maxLength={6} className={`${styles.formInput} ${addrErrors.pincode ? styles.formInputError : ""}`} value={newAddr.pincode} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, pincode: v }); setAddrErrors({ ...addrErrors, pincode: "" }); }} />
                {addrErrors.pincode && <p className={styles.formError}>{addrErrors.pincode}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City *</label>
                <input type="text" placeholder="Enter here" className={`${styles.formInput} ${addrErrors.city ? styles.formInputError : ""}`} value={newAddr.city} onChange={(e) => { setNewAddr({ ...newAddr, city: e.target.value }); setAddrErrors({ ...addrErrors, city: "" }); }} />
                {addrErrors.city && <p className={styles.formError}>{addrErrors.city}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>State *</label>
                <input type="text" placeholder="Type here" className={`${styles.formInput} ${addrErrors.state ? styles.formInputError : ""}`} value={newAddr.state} onChange={(e) => { setNewAddr({ ...newAddr, state: e.target.value }); setAddrErrors({ ...addrErrors, state: "" }); }} />
                {addrErrors.state && <p className={styles.formError}>{addrErrors.state}</p>}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Landmark</label>
              <input type="text" placeholder="Near..." className={styles.formInput} value={newAddr.landmark} onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })} />
            </div>
            <div className={styles.saveAsGroup}>
              <span className={styles.saveAsLabel}>Save Address as</span>
              <div className={styles.saveAsTags}>
                <button className={`${styles.saveAsTag} ${newAddr.type === "home" ? styles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, type: "home" })}>Home</button>
                <button className={`${styles.saveAsTag} ${newAddr.type === "work" ? styles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, type: "work" })}>Work</button>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowNewAddress(false)}>Cancel</button>
              <button className={styles.saveAddressBtn} onClick={handleSaveAddress} disabled={isAdding || isUpdating}>
                {(isAdding || isUpdating) ? "Saving..." : "Save Address ›"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressesTab;
