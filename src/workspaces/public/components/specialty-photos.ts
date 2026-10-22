import musculoskeletal from '../../../assets/images/specialties/musculoskeletal.jpg'
import dermatology from '../../../assets/images/specialties/dermatology.jpg'
import pediatrics from '../../../assets/images/specialties/pediatrics.jpg'
import endocrinology from '../../../assets/images/specialties/endocrinology.jpg'
import general from '../../../assets/images/specialties/general.jpg'
import dental from '../../../assets/images/specialties/dental.jpg'
import ent from '../../../assets/images/specialties/ent.jpg'
import cardiology from '../../../assets/images/specialties/cardiology.jpg'
import digestive from '../../../assets/images/specialties/digestive.jpg'

export const specialtyPhotos = [
  { key: 'musculoskeletal', match: 'co xuong', src: musculoskeletal, width: 720, height: 720, position: '50% 10%', alt: 'Chuyên viên hỗ trợ vận động khớp gối', author: 'Funkcinės Terapijos Centras', source: 'https://www.pexels.com/photo/physiotherapist-holding-a-patients-knee-20860595/' },
  { key: 'dermatology', match: 'da lieu', src: dermatology, width: 720, height: 481, position: '50% 40%', alt: 'Bác sĩ kiểm tra vùng da ở cổ', author: 'Pavel Danilyuk', source: 'https://www.pexels.com/photo/a-doctor-checking-his-patient-7108173/' },
  { key: 'pediatrics', match: 'nhi', src: pediatrics, width: 720, height: 481, position: '50% 40%', alt: 'Bác sĩ khám cho trẻ bằng ống nghe', author: 'Pavel Danilyuk', source: 'https://www.pexels.com/photo/a-doctor-checking-up-the-girl-using-stethoscope-7653116/' },
  { key: 'endocrinology', match: 'noi tiet', src: endocrinology, width: 720, height: 480, position: '50% 65%', alt: 'Nhân viên y tế kiểm tra đường huyết bằng thiết bị cầm tay', author: 'Pavel Danilyuk', source: 'https://www.pexels.com/photo/glucose-meter-in-doctor-hands-7653129/' },
  { key: 'dental', match: 'rang', src: dental, width: 720, height: 480, position: '50% 45%', alt: 'Nhân viên nha khoa chăm sóc răng miệng tại phòng khám', author: 'Andrea Piacquadio', source: 'https://www.pexels.com/photo/young-female-dentist-examining-teeth-of-patient-with-assistant-in-modern-clinic-3881296/' },
  { key: 'ent', match: 'tai mui', src: ent, width: 720, height: 480, position: '50% 50%', alt: 'Nhân viên y tế kiểm tra tai bằng dụng cụ chuyên dụng', author: 'Kaboompics', source: 'https://www.pexels.com/photo/a-patient-having-ear-examination-5206951/' },
  { key: 'cardiology', match: 'tim mach', src: cardiology, width: 720, height: 480, position: '50% 45%', alt: 'Bác sĩ thăm khám bằng ống nghe', author: 'Los Muertos Crew', source: 'https://www.pexels.com/photo/a-doctor-checking-a-patient-8460221/' },
  { key: 'digestive', match: 'tieu hoa', src: digestive, width: 720, height: 480, position: '50% 45%', alt: 'Bác sĩ thăm khám người bệnh tại phòng khám', author: 'Los Muertos Crew', source: 'https://www.pexels.com/photo/doctor-performing-auscultation-on-a-patient-lying-on-the-bed-8460084/' },
  { key: 'general', match: '', src: general, width: 720, height: 480, position: '50% 35%', alt: 'Bác sĩ và người bệnh trong buổi khám sức khỏe', author: 'Antoni Shkraba', source: 'https://www.pexels.com/photo/doctor-checking-the-heart-beat-of-a-man-5215012/' },
]

export function getSpecialtyPhoto(name: string) {
  const normalized = name.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
  return specialtyPhotos.find(photo => photo.match && normalized.includes(photo.match)) ?? specialtyPhotos[specialtyPhotos.length - 1]
}
