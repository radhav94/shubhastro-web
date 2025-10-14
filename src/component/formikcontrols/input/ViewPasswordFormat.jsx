import React from 'react';
import styles from "./ViewPasswordFormat.module.scss"
import { passwordInstructions } from 'utils/constants';

const ViewPasswordFormat = () => {
    return (
        <div className={styles.passwordNotes} onClick={(e)=>e.stopPropagation()}>
            <strong>Note: </strong>
            Password must -
            <ul>
                {passwordInstructions.map(instruction => (
                    <li>{instruction}</li>
                ))}
            </ul>
        </div>
    );
}
 
export default ViewPasswordFormat;