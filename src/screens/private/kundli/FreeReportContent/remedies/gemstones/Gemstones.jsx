import styles from './Gemstones.module.scss'
const Gemstones = () => {
    return (
        <div>
            <div className='text-sm p-3 m-2'>
                <h2 className='font-bold text-base mb-1' >Life Stone</h2>
                <div className='border-gray-300 border rounded-md p-3'>
                    <h3 className='text-base' >Life stone for Taurus (Vrishabha Lagna)</h3>
                    <p>A life stone is a gem for the Lagna lord, which the native can wear throughout his or her life. A life stone collectively influences everything that makes your self-image, i.e. your wealth, education, health, business, spouse, intellect, etc. The lord of the Taurus ascendant/Lagna is Venus, and to please Venus, the person born with Taurus Ascendant (Vrishabha Lagna) must wear Diamond.</p>
                    <div className='border-gray-300 border rounded-md p-2 m-2'  >
                        <div className='grid grid-cols-2 mb-3 ' >
                        <p>Life stone for Taurus (Vrishabha Lagna)</p>
                        <p>	Diamond (Heera)</p>
                    </div>
                    <div className='grid grid-cols-2 mb-3 ' >
                        <p>How to wear</p>
                        <p>Gold or silver on middle finger</p>
                    </div>
                    <div className='grid grid-cols-2' >
                        <p>Mantra</p>
                        <p>Om dram drim draum sah shukraya namah</p>
                    </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Gemstones;