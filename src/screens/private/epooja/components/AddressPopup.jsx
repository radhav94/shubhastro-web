import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./AddressPopup.module.scss";
import { FiX, FiHome, FiBriefcase, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useGetAddressesQuery, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";
import { personNameRegex, placeNameRegex, PERSON_NAME_ERROR } from "../../../../utils/regex";

const EMPTY_ADDR = { name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" };

/**
 * AddressPopup — shared address selection + add/edit modal for the mall module.
 *
 * Props:
 *  - open (bool): whether the popup is visible
 *  - onClose (): called when user closes the popup
 *  - onSelect (address): called when user confirms an address selection
 *  - confirmLabel (string): label for the confirm button (default: "Order Here")
 *  - confirmDisabled (bool): disable the confirm button externally
 *  - defaultSelectedId (string): pre-select an address by ID
 */
const AddressPopup = ({ open, onClose, onSelect, confirmLabel = "Order Here", confirmDisabled = false, defaultSelectedId = null }) => {
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(defaultSelectedId);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddr, setNewAddr] = useState(EMPTY_ADDR);
  const [addrErrors, setAddrErrors] = useState({});

  // Address API — skip fetching until popup is opened
  const { data: addressData, isLoading: addressLoading } = useGetAddressesQuery(undefined, { skip: !open });
  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();
  const [updateAddressApi, { isLoading: isUpdatingAddress }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const addresses = addressData?.data || addressData?.data?.addresses || [];
  const addressList = Array.isArray(addresses) ? addresses : [];

  // Reset internal state when popup opens
  useEffect(() => {
    if (open) {
      setShowNewAddress(false);
      setEditingAddress(null);
      setNewAddr(EMPTY_ADDR);
      setAddrErrors({});
    }
  }, [open]);

  // Auto-show add form when no addresses exist
  useEffect(() => {
    if (open && !addressLoading && addressList.length === 0) {
      setShowNewAddress(true);
    }
  }, [open, addressLoading, addressList.length]);

  // Auto-select default address
  useEffect(() => {
    if (addressList.length > 0 && !selectedAddress) {
      if (defaultSelectedId && addressList.find((a) => (a._id || a.id) === defaultSelectedId)) {
        setSelectedAddress(defaultSelectedId);
      } else {
        const def = addressList.find((a) => a.isDefault) || addressList[0];
        setSelectedAddress(def?._id || def?.id);
      }
    }
  }, [addressList, selectedAddress, defaultSelectedId]);

  const validateAddress = () => {
    const errs = {};
    if (!newAddr.name.trim()) errs.name = "Name is required";
    else if (!personNameRegex.test(newAddr.name.trim())) errs.name = PERSON_NAME_ERROR;
    if (!newAddr.phone.trim()) errs.phone = "Phone is required";
    else if (!/^\d{10}$/.test(newAddr.phone.trim())) errs.phone = "Enter a valid 10-digit phone number";
    if (!newAddr.addressLine1.trim()) errs.addressLine1 = "Address line 1 is required";
    if (!newAddr.pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(newAddr.pincode.trim())) errs.pincode = "Enter a valid 6-digit pincode";
    if (!newAddr.city.trim()) errs.city = "City is required";
    else if (!placeNameRegex.test(newAddr.city.trim())) errs.city = "Please enter a valid city";
    if (!newAddr.state.trim()) errs.state = "State is required";
    else if (!placeNameRegex.test(newAddr.state.trim())) errs.state = "Please enter a valid state";
    setAddrErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddAddress = async () => {
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
      name: addr.name || "", phone: addr.phone || "", addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "", city: addr.city || "", state: addr.state || "",
      pincode: addr.pincode || "", landmark: addr.landmark || "", type: addr.type || "home", country: addr.country || "IN",
    });
    setAddrErrors({});
    setShowNewAddress(true);
  };

  const handleDeleteAddress = async (addrId) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await deleteAddress({ addressId: addrId }).unwrap();
      Toast.success("Address deleted");
      if (selectedAddress === addrId) setSelectedAddress(null);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to delete address");
    }
  };

  const handleConfirm = () => {
    const chosen = addressList.find((a) => (a._id || a.id) === selectedAddress);
    if (chosen && onSelect) onSelect(chosen);
  };

  if (!open) return null;

  // If no addresses and popup just opened, show add form directly
  const shouldShowList = !showNewAddress;

  return createPortal(
    <>
      {shouldShowList && (
        <div className={styles.overlay} onClick={onClose}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={onClose} aria-label="Close"><FiX /></button>
            <h2 className={styles.modalTitle}>SELECT ADDRESS</h2>
            <div className={styles.addressList}>
              {addressLoading && <p style={{ textAlign: "center", color: "#999", padding: "16px 0" }}>Loading addresses...</p>}
              {!addressLoading && addressList.length === 0 && (
                <p style={{ textAlign: "center", color: "#aaa", padding: "16px 0" }}>No saved addresses</p>
              )}
              {!addressLoading && addressList.map((a) => {
                const addrId = a._id || a.id;
                const addrType = a.type || "home";
                return (
                  <div key={addrId} className={`${styles.addressCard} ${selectedAddress === addrId ? styles.addressActive : ""}`} onClick={() => setSelectedAddress(addrId)} style={{ cursor: "pointer" }}>
                    <span className={styles.addressIcon}>{addrType === "home" ? <FiHome /> : <FiBriefcase />}</span>
                    <div className={styles.addressInfo}>
                      <span className={styles.addressType}>{a.name || addrType}{a.phone ? ` · ${a.phone}` : ""}</span>
                      <p className={styles.addressText}>
                        {[a.addressLine1, a.addressLine2, a.landmark].filter(Boolean).join(", ")}
                        <br />{[a.city, a.state, a.pincode].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <button className={styles.addrActionBtn} onClick={(e) => { e.stopPropagation(); openEditAddress(a); }} aria-label="Edit address"><FiEdit2 size={14} /></button>
                    <button className={styles.addrActionBtn} onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addrId); }} aria-label="Delete address"><FiTrash2 size={14} /></button>
                    <input type="radio" name="address" checked={selectedAddress === addrId} readOnly className={styles.addressRadio} />
                  </div>
                );
              })}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.addAddressBtn} onClick={() => { setEditingAddress(null); setNewAddr(EMPTY_ADDR); setAddrErrors({}); setShowNewAddress(true); }}>Add New Address +</button>
              <button className={styles.orderBtn} disabled={!selectedAddress || confirmDisabled} onClick={handleConfirm}>{confirmLabel}</button>
            </div>
          </div>
        </div>
      )}

      {showNewAddress && (
        <div className={styles.overlay} onClick={() => setShowNewAddress(false)}>
          <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowNewAddress(false)} aria-label="Close"><FiX /></button>
            <h2 className={styles.modalTitle}>{editingAddress ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name <span style={{ color: "#dc2626" }}>*</span></label>
                <input type="text" placeholder="Full name" className={`${styles.formInput} ${addrErrors.name ? styles.formInputError : ""}`} value={newAddr.name} onChange={(e) => { setNewAddr({ ...newAddr, name: e.target.value }); setAddrErrors({ ...addrErrors, name: "" }); }} />
                {addrErrors.name && <p className={styles.formError}>{addrErrors.name}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone <span style={{ color: "#dc2626" }}>*</span></label>
                <input type="tel" placeholder="Phone number" maxLength={10} className={`${styles.formInput} ${addrErrors.phone ? styles.formInputError : ""}`} value={newAddr.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, phone: v }); setAddrErrors({ ...addrErrors, phone: "" }); }} />
                {addrErrors.phone && <p className={styles.formError}>{addrErrors.phone}</p>}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address line 1 <span style={{ color: "#dc2626" }}>*</span></label>
              <input type="text" placeholder="Enter here" className={`${styles.formInput} ${addrErrors.addressLine1 ? styles.formInputError : ""}`} value={newAddr.addressLine1} onChange={(e) => { setNewAddr({ ...newAddr, addressLine1: e.target.value }); setAddrErrors({ ...addrErrors, addressLine1: "" }); }} />
              {addrErrors.addressLine1 && <p className={styles.formError}>{addrErrors.addressLine1}</p>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address line 2</label>
              <input type="text" placeholder="Enter here" className={styles.formInput} value={newAddr.addressLine2} onChange={(e) => setNewAddr({ ...newAddr, addressLine2: e.target.value })} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Pincode <span style={{ color: "#dc2626" }}>*</span></label>
                <input type="text" placeholder="Enter here" maxLength={6} className={`${styles.formInput} ${addrErrors.pincode ? styles.formInputError : ""}`} value={newAddr.pincode} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, pincode: v }); setAddrErrors({ ...addrErrors, pincode: "" }); }} />
                {addrErrors.pincode && <p className={styles.formError}>{addrErrors.pincode}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City <span style={{ color: "#dc2626" }}>*</span></label>
                <input type="text" placeholder="Enter here" className={`${styles.formInput} ${addrErrors.city ? styles.formInputError : ""}`} value={newAddr.city} onChange={(e) => { setNewAddr({ ...newAddr, city: e.target.value }); setAddrErrors({ ...addrErrors, city: "" }); }} />
                {addrErrors.city && <p className={styles.formError}>{addrErrors.city}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>State <span style={{ color: "#dc2626" }}>*</span></label>
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
                <button className={`${styles.saveAsTag} ${newAddr.type === "other" ? styles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, type: "other" })}>Other</button>
              </div>
            </div>
            <button className={styles.saveAddressBtn} onClick={handleAddAddress} disabled={isAddingAddress || isUpdatingAddress}>
              {(isAddingAddress || isUpdatingAddress) ? "Saving..." : (editingAddress ? "Update Address ›" : "Save Address ›")}
            </button>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default AddressPopup;
