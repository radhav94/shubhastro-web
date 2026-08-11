import { useLocation } from "react-router-dom";
import styles from "./Payment.module.scss";
import { getAstrologerDisplayName } from "../../../../utils/helper/string.utils";

const PaymentScreen = () => {
  const location = useLocation();
  const astrologer = location.state?.data;

  if (!astrologer) return <div>No data found</div>;

  const amount = parseInt(astrologer?.price?.amount) || 0;
  const gst = +(amount * 0.18).toFixed(2);
  const total = amount + gst;

  console.log(astrologer)

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Payment Information</h2>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>PRODUCT</th>
            <th>ASTROLOGER</th>
            <th>AMOUNT</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>{getAstrologerDisplayName(astrologer)} Consultation</td>
            <td>{getAstrologerDisplayName(astrologer)}</td>
            <td>₹ {amount}</td>
          </tr>

          <tr>
            <td>Total Amount</td>
            <td></td>
            <td>₹ {amount}</td>
          </tr>

          <tr>
            <td>GST @18%</td>
            <td></td>
            <td>₹ {gst}</td>
          </tr>

          <tr>
            <td>
              <b>Total Payable Amount</b>
            </td>
            <td></td>
            <td>
              <b>₹ {total}</b>
            </td>
          </tr>
        </tbody>
      </table>

      <div className={styles.paymentMethods}>
        <button>Credit/Debit Card</button>
        <button>PhonePe</button>
        <button>GPay</button>
        <button>Paytm</button>
        <button>BHIM</button>
        <button>Other Wallets</button>
      </div>
    </div>
  );
};

export default PaymentScreen;
