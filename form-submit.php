<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'ok' => false,
        'message' => 'Ungültige Anfrageart.',
    ]);
}

$recipient = getenv('CONTACT_FORM_TO') ?: 'kontakt@deine-domain.de';
if ($recipient === 'kontakt@deine-domain.de') {
    respond(500, [
        'ok' => false,
        'message' => 'Formular ist noch nicht vollständig konfiguriert.',
    ]);
}

$formType = trim((string) ($_POST['form_type'] ?? 'kontakt'));
$firstName = trim((string) ($_POST['first_name'] ?? ''));
$lastName = trim((string) ($_POST['last_name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$branche = trim((string) ($_POST['branche'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));
$websiteUrl = trim((string) ($_POST['website_url'] ?? ''));

if ($firstName === '') {
    respond(422, [
        'ok' => false,
        'message' => 'Bitte gib deinen Vornamen ein.',
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, [
        'ok' => false,
        'message' => 'Bitte gib eine gültige E-Mail-Adresse ein.',
    ]);
}

$fullName = trim($firstName . ' ' . $lastName);
if ($fullName === '') {
    $fullName = $firstName;
}

$subjectPrefix = $formType === 'modal' ? 'Neue Anfrage (Modal)' : 'Neue Anfrage (Kontaktformular)';
$subjectRaw = $subjectPrefix . ' - SeitenArchitekt';
$subject = '=?UTF-8?B?' . base64_encode($subjectRaw) . '?=';

$host = $_SERVER['HTTP_HOST'] ?? 'seitenarchitekt.de';
$safeHost = preg_replace('/[^a-zA-Z0-9.-]/', '', (string) $host);
if ($safeHost === '') {
    $safeHost = 'seitenarchitekt.de';
}

$headers = [];
$headers[] = 'From: SeitenArchitekt Formular <no-reply@' . $safeHost . '>';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: PHP/' . PHP_VERSION;

$lines = [];
$lines[] = 'Neue Formularanfrage';
$lines[] = '-------------------';
$lines[] = 'Formulartyp: ' . $formType;
$lines[] = 'Name: ' . $fullName;
$lines[] = 'E-Mail: ' . $email;
$lines[] = 'Branche: ' . ($branche !== '' ? $branche : '-');
$lines[] = 'Website: ' . ($websiteUrl !== '' ? $websiteUrl : '-');
$lines[] = 'Nachricht: ' . ($message !== '' ? $message : '-');
$lines[] = 'Zeitpunkt: ' . gmdate('Y-m-d H:i:s') . ' UTC';
$lines[] = 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? '-');

$body = implode("\n", $lines);

$sent = @mail($recipient, $subject, $body, implode("\r\n", $headers));
if (!$sent) {
    respond(500, [
        'ok' => false,
        'message' => 'Senden fehlgeschlagen. Bitte versuche es erneut oder nutze Telefon/WhatsApp.',
    ]);
}

respond(200, [
    'ok' => true,
    'message' => 'Danke! Deine Anfrage wurde erfolgreich gesendet.',
]);
