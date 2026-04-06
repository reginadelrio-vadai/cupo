import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Hr,
} from '@react-email/components'

interface Props {
  clientName: string
  serviceName: string
  professionalName: string
  dateStr: string
  meetUrl?: string
  orgName: string
}

export function AppointmentConfirmationEmail({
  clientName = 'Cliente',
  serviceName = 'Consulta',
  professionalName = 'Profesional',
  dateStr = 'Lunes 1 de enero a las 10:00',
  meetUrl,
  orgName = 'Mi Negocio',
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "'Inter', Arial, sans-serif", backgroundColor: '#F8FAFC', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 24px' }}>
          <Text style={{ fontSize: '20px', fontWeight: 500, color: '#0F172A', margin: '0 0 8px' }}>
            ¡Cita confirmada!
          </Text>
          <Text style={{ fontSize: '14px', color: '#475569', margin: '0 0 24px' }}>
            Hola {clientName}, tu cita ha sido confirmada.
          </Text>

          <Section style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
            <Text style={{ fontSize: '14px', color: '#0F172A', margin: '0 0 4px', fontWeight: 500 }}>
              {serviceName}
            </Text>
            <Text style={{ fontSize: '13px', color: '#475569', margin: '0 0 4px' }}>
              con {professionalName}
            </Text>
            <Text style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
              {dateStr}
            </Text>
            {meetUrl && (
              <Text style={{ margin: '12px 0 0' }}>
                <a href={meetUrl} style={{ color: '#00B8E6', fontSize: '13px' }}>
                  Unirse a videollamada
                </a>
              </Text>
            )}
          </Section>

          <Hr style={{ borderColor: '#E2E8F0', margin: '24px 0' }} />

          <Text style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
            {orgName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default AppointmentConfirmationEmail
