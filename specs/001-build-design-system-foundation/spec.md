# Feature Specification: Nền tảng Design System dùng chung

**Feature Branch**: `001-build-design-system-foundation`  
**Created**: 2026-07-23  
**Status**: Draft  
**Input**: User description: "Xây dựng bộ Design System base dùng chung để đồng bộ UI/UX toàn ứng dụng, cải thiện hiệu năng và trải nghiệm PWA; hoàn thành nền tảng và các thành phần cơ bản có thể tái sử dụng trước, sau đó mới migration từng màn hình theo vertical slice, không thay đổi toàn bộ ứng dụng trong một lần."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Thiết lập nền tảng giao diện thống nhất (Priority: P1)

Nhóm sản phẩm, thiết kế và phát triển cần một nguồn quy chuẩn chung cho màu sắc, chữ, khoảng cách, bo góc, độ nổi, chuyển động, biểu tượng và các thành phần giao diện cơ bản để mọi phần mới của ứng dụng có cùng ngôn ngữ hình ảnh.

**Why this priority**: Đây là điều kiện tiên quyết cho mọi màn hình V2. Migration màn hình trước khi có nền tảng chung sẽ tiếp tục tạo biến thể giao diện và tăng chi phí sửa lại.

**Independent Test**: Có thể kiểm thử độc lập bằng cách duyệt danh mục Design System, đối chiếu toàn bộ quy chuẩn và trạng thái của các thành phần cơ bản mà không thay đổi bất kỳ màn hình production nào.

**Acceptance Scenarios**:

1. **Given** đã có inventory và baseline của giao diện hiện tại, **When** nhóm duyệt bộ quy chuẩn nền tảng, **Then** mọi vai trò hình ảnh bắt buộc đều có tên, mục đích sử dụng và ví dụ đúng/sai rõ ràng.
2. **Given** một thành phần cơ bản trong danh mục, **When** người duyệt chuyển qua các biến thể và trạng thái được hỗ trợ, **Then** thành phần chỉ dùng quy chuẩn đã công bố và không tạo giá trị hình ảnh tùy ý.
3. **Given** ứng dụng production hiện tại, **When** nền tảng Design System được bổ sung, **Then** hành vi nghiệp vụ, điều hướng và giao diện của các màn hình production vẫn giữ nguyên.

---

### User Story 2 - Xác nhận UX và hiệu năng PWA của bộ base (Priority: P2)

Nhóm QA và phát hành cần xác nhận các thành phần base phản hồi nhanh, dễ thao tác, hỗ trợ khả năng tiếp cận và hiển thị ổn định trên các kích thước PWA mục tiêu trước khi cho phép màn hình production sử dụng.

**Why this priority**: Bộ base sẽ được tái sử dụng rộng. Lỗi tương tác, khả năng tiếp cận hoặc hiệu năng trong base sẽ lan sang mọi màn hình được migration sau đó.

**Independent Test**: Có thể chạy ma trận kiểm thử trên danh mục nội bộ và màn hình tham chiếu với dữ liệu ngắn, dài và trạng thái biên; không phụ thuộc vào việc migration một màn hình nghiệp vụ.

**Acceptance Scenarios**:

1. **Given** các viewport mục tiêu và chế độ PWA standalone, **When** người dùng thao tác bằng chạm, bàn phím hoặc công cụ hỗ trợ, **Then** mục tiêu chạm, focus, nhãn, tương phản, safe area và chuyển động giảm đều đáp ứng chuẩn đã công bố.
2. **Given** nội dung dài, tiếng Việt có dấu, số tiền lớn, badge dài và các trạng thái loading/disabled/error, **When** thành phần được hiển thị, **Then** nội dung không bị mất nghĩa, thao tác chính vẫn khả dụng và bố cục không vỡ.
3. **Given** danh sách tham chiếu dài trên PWA, **When** người dùng cuộn và thao tác liên tục, **Then** giao diện không tạo vùng cuộn lồng nhau, không có khoảng dừng vượt ngân sách và vẫn phản hồi trong ngưỡng chấp nhận.

---

### User Story 3 - Chuẩn bị migration từng màn hình an toàn (Priority: P3)

Nhóm phát hành cần một quy trình để mỗi màn hình được migration thành một hạng mục riêng, có bản cũ làm fallback, có kiểm soát bật/tắt độc lập và có tiêu chí rollback rõ ràng.

**Why this priority**: Migration theo từng vertical slice giảm rủi ro production, tránh nhánh kéo dài và cho phép bug fix hoặc hotfix tiếp tục bình thường trong thời gian chuyển đổi.

**Independent Test**: Có thể kiểm thử bằng một kịch bản migration tham chiếu không thay màn hình production: tạo hồ sơ hạng mục, kiểm tra đủ điều kiện đầu vào, mô phỏng chuyển đổi phiên bản và xác nhận fallback.

**Acceptance Scenarios**:

1. **Given** một màn hình được đề xuất migration, **When** hồ sơ hạng mục thiếu hành vi phải giữ, tiêu chí chấp nhận, phạm vi, baseline, quyền truy cập, kế hoạch kiểm thử hoặc rollback, **Then** hạng mục chưa được phép bước vào triển khai.
2. **Given** một màn hình V2 trong tương lai gặp lỗi, **When** người vận hành tắt quyền sử dụng phiên bản mới của riêng màn hình đó, **Then** người dùng quay lại bản Legacy mà không đổi dữ liệu, đường điều hướng hoặc hành vi nghiệp vụ.
3. **Given** nhiều màn hình chưa migration, **When** một vertical slice được phát hành, **Then** chỉ màn hình thuộc slice đó thay đổi và các màn hình còn lại tiếp tục dùng giao diện hiện tại.

### Edge Cases

- Giá trị hình ảnh hiện tại chưa có vai trò tương đương trong bộ quy chuẩn mới phải được phân loại hoặc ghi nhận ngoại lệ; không được âm thầm tạo giá trị tùy ý.
- Thành phần base dùng nguồn bên ngoài nhưng không đạt cổng tương thích, kích thước tải, cuộn, overlay hoặc vòng đời ứng dụng không được chấp nhận để dùng cho màn hình production.
- Style của Design System mới không được rò rỉ sang Legacy hoặc làm đổi giao diện của phần chưa migration.
- Văn bản rất dài, cỡ chữ hệ thống lớn, tiếng Việt có dấu, số tiền lớn và badge dài phải giữ được nội dung quan trọng.
- Thiết bị có safe area, bàn phím ảo, thao tác back và tùy chọn reduced motion phải giữ luồng sử dụng an toàn.
- Trạng thái offline, lỗi, tải lâu, không có dữ liệu, không có quyền và retry phải có quy tắc hiển thị nhất quán cho các slice tương lai.
- Danh sách nhỏ không bị áp dụng tối ưu phức tạp không cần thiết; danh sách dài chỉ được tối ưu sau khi có số đo baseline.
- Migration dở dang không được khiến một màn hình trộn tùy ý thành phần Legacy và thành phần V2 trong cùng một composition.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST có inventory giao diện hiện tại gồm màu, typography, spacing, radius, elevation, motion, icon, biến thể thành phần trùng lặp, style có nguy cơ rò rỉ và các màn hình có danh sách dài.
- **FR-002**: Hệ thống MUST lưu baseline hình ảnh và baseline trải nghiệm/hiệu năng PWA trước khi thay đổi màn hình production.
- **FR-003**: Design System MUST định nghĩa bộ quy chuẩn semantic tối thiểu cho brand, background, surface, text, border, status, spacing, typography, radius, elevation, motion, layout và safe area.
- **FR-004**: Mỗi quy chuẩn semantic MUST có tên, mục đích, phạm vi sử dụng và ví dụ áp dụng để người triển khai không cần tự chọn giá trị hình ảnh mới.
- **FR-005**: Design System MUST cung cấp bộ thành phần base tối thiểu cho text, icon, button, icon button, input, search, card, badge, divider và loading skeleton.
- **FR-006**: Mỗi thành phần base MUST công bố các biến thể, kích thước, trạng thái và hành vi tương tác được hỗ trợ; các thuộc tính tùy ý làm phá vỡ ngôn ngữ hình ảnh MUST bị từ chối.
- **FR-007**: Các thành phần có tương tác MUST hỗ trợ đầy đủ trạng thái phù hợp gồm default, pressed, focused, disabled, loading, selected và error.
- **FR-008**: Design System MUST có danh mục nội bộ hiển thị mọi quy chuẩn, thành phần, biến thể, trạng thái, nội dung biên và hướng dẫn sử dụng đúng/sai.
- **FR-009**: Danh mục nội bộ MUST tách khỏi luồng nghiệp vụ thông thường và không trở thành màn hình dành cho người dùng production.
- **FR-010**: Mọi style của Design System MUST được giới hạn trong phạm vi rõ ràng và MUST NOT làm thay đổi thành phần Legacy chưa được migration.
- **FR-011**: Màn hình nghiệp vụ MUST chỉ sử dụng hợp đồng thành phần nội bộ; nguồn primitive bên ngoài, nếu có, MUST được cô lập và không được dùng trực tiếp trong feature code.
- **FR-012**: Nguồn primitive bên ngoài MUST vượt qua cổng tương thích, kích thước tải, style isolation, navigation lifecycle, scroll, overlay và hiệu năng PWA trước khi được chấp nhận.
- **FR-013**: Nền tảng mới MUST giữ nguyên application shell, navigation lifecycle, overlay, safe area, keyboard behavior và tích hợp thiết bị hiện có.
- **FR-014**: Nền tảng mới MUST NOT thay đổi data contract, state management, quyền truy cập, business rule hoặc luồng nghiệp vụ hiện tại.
- **FR-015**: Thành phần base MUST có mục tiêu chạm tối thiểu 44 × 44 điểm, focus nhìn thấy được, nhãn có nghĩa, thứ tự bàn phím hợp lý và tương phản đạt WCAG 2.1 AA.
- **FR-016**: Chuyển động MUST tôn trọng tùy chọn reduced motion và MUST NOT làm trì hoãn thao tác chính hoặc dựa vào chuyển động để truyền tải thông tin duy nhất.
- **FR-017**: Quy tắc layout MUST yêu cầu một vùng cuộn chính cho mỗi màn hình và ngăn tạo vùng cuộn lồng nhau khi migration.
- **FR-018**: Tối ưu danh sách MUST dựa trên số đo; giải pháp dành cho danh sách dài MUST NOT được áp dụng mặc định cho danh sách nhỏ.
- **FR-019**: Mọi dependency UI mới MUST có báo cáo tác động tới thời gian sẵn sàng sử dụng, kích thước tải, style footprint và lợi ích so với bộ thành phần nội bộ trước khi được chấp nhận.
- **FR-020**: Bộ base MUST được kiểm tra tối thiểu tại các viewport 390 × 844, 393 × 852, 412 × 915 và 768 × 1024, bao gồm chế độ PWA standalone.
- **FR-021**: Bộ base MUST có ma trận kiểm thử cho visual, touch, keyboard, safe area, back behavior, reduced motion, loading, empty, error, offline, retry và permission-denied.
- **FR-022**: Feature hiện tại MUST hoàn thành inventory, foundations, core base components, danh mục nội bộ, quality gates và hợp đồng migration trước khi bắt đầu thay đổi màn hình production.
- **FR-023**: Feature hiện tại MUST NOT migration, bật UI V2 hoặc xóa Legacy của bất kỳ màn hình production nào.
- **FR-024**: Mỗi màn hình tương lai MUST được migration bằng một vertical slice riêng, giữ nguyên hành vi và có quyền bật/tắt độc lập cùng Legacy fallback.
- **FR-025**: Mỗi vertical slice tương lai MUST có phạm vi file, hành vi phải giữ, tiêu chí chấp nhận, feature control, test plan, manual QA, performance baseline và rollback plan trước khi triển khai.
- **FR-026**: Việc xóa Legacy MUST là hạng mục cleanup riêng và chỉ được thực hiện sau ít nhất một chu kỳ phát hành ổn định, không còn nhu cầu rollback và các kiểm thử liên quan đã ổn định.
- **FR-027**: Tài liệu Design System MUST được cập nhật cùng thay đổi foundation hoặc component contract; breaking change MUST được ghi rõ trước khi được sử dụng.

### Key Entities

- **Semantic Foundation**: Bộ vai trò hình ảnh có tên và mục đích rõ ràng, bao gồm màu, chữ, khoảng cách, radius, elevation, motion, layout và safe area.
- **Base Component Contract**: Định nghĩa một thành phần dùng chung, gồm mục đích, biến thể, kích thước, trạng thái, hành vi, accessibility và giới hạn tùy biến.
- **UI Catalog Example**: Ví dụ có thể duyệt và kiểm thử cho một foundation hoặc component contract, gồm nội dung chuẩn, nội dung biên và hướng dẫn đúng/sai.
- **Experience Baseline**: Tập số đo và ảnh chụp trước thay đổi dùng để phát hiện regression về hình ảnh, tương tác và hiệu năng.
- **Migration Slice**: Một màn hình hoặc luồng hoàn chỉnh được chuyển đổi độc lập sau khi bộ base đạt quality gate.
- **Feature Control**: Quyền chuyển đổi riêng một migration slice giữa phiên bản mới và Legacy.
- **Rollback Record**: Điều kiện, người chịu trách nhiệm và các bước đưa một migration slice về Legacy mà không đổi dữ liệu hay hành vi nghiệp vụ.

### Assumptions

- Tài liệu `ui-ux-migration-plan.md` là nguồn requirement chính; tài liệu canvas bổ sung quality gate, governance và phạm vi khi không làm thay đổi mục tiêu chính.
- Feature này bao gồm foundation và core base components; component nghiệp vụ, pattern theo domain và màn hình production thuộc các feature sau.
- Light theme hiện tại là phạm vi baseline; dark mode không thuộc phase đầu.
- Giao diện production hiện tại tiếp tục là mặc định cho đến khi từng migration slice được phê duyệt và bật riêng.
- Số đo hiệu năng được thực hiện trên thiết bị và điều kiện mạng baseline do nhóm QA thống nhất, dùng cùng điều kiện trước và sau để so sánh.

### Dependencies

- Nhóm sản phẩm hoặc thiết kế xác nhận vai trò brand, status và quy tắc typography trước khi đóng quality gate.
- Nhóm QA cung cấp thiết bị/viewport baseline và dữ liệu tham chiếu cho danh sách ngắn, dài và các trạng thái biên.
- Chủ sở hữu từng feature xác nhận business behavior, quyền truy cập và rollback trước khi màn hình của họ bước vào migration.

### Out of Scope

- Migration hoặc redesign bất kỳ màn hình production nào trong feature này.
- Thay application shell, router, navigation lifecycle, data contract, state management hoặc business logic.
- Thay toàn bộ button, card, input hoặc component cùng loại trên toàn ứng dụng trong một lần.
- Xóa Legacy, bật UI V2 trên production hoặc cleanup diện rộng.
- Dark mode, animation phức tạp và nâng major framework.
- Tối ưu hiệu năng màn hình chưa có baseline hoặc bottleneck đã đo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% vai trò hình ảnh và biến thể component xuất hiện trong danh mục nội bộ dùng quy chuẩn semantic đã công bố; không còn giá trị hình ảnh tùy ý trong bộ base.
- **SC-002**: 100% thành phần base được liệt kê hiển thị đủ biến thể, kích thước, trạng thái và nội dung biên trong danh mục nội bộ ở cả bốn viewport mục tiêu.
- **SC-003**: Ít nhất 95% thao tác quan trọng trong danh mục nội bộ có phản hồi nhìn thấy được trong vòng 100 ms trên thiết bị PWA baseline.
- **SC-004**: Trong kịch bản danh sách tham chiếu 200 mục, ít nhất 95% thời gian cuộn không xuất hiện khoảng dừng dài hơn 100 ms và không có vùng cuộn lồng nhau.
- **SC-005**: 100% thành phần tương tác trong bộ base đạt mục tiêu chạm tối thiểu, focus nhìn thấy, nhãn có nghĩa và tương phản WCAG 2.1 AA.
- **SC-006**: Thời gian để người dùng có thể bắt đầu thao tác với ứng dụng PWA sau khi thêm bộ base không chậm hơn baseline quá 5% trong cùng điều kiện đo.
- **SC-007**: 100% smoke scenario hiện có cho điều hướng, overlay, keyboard, safe area và luồng nghiệp vụ không bị regression do feature nền tảng.
- **SC-008**: 100% hạng mục migration màn hình tương lai bị chặn nếu thiếu bất kỳ mục Definition of Ready nào và có thể rollback riêng về Legacy trong vòng 5 phút mà không đổi dữ liệu.
- **SC-009**: Không có màn hình production nào thay đổi giao diện hoặc được bật UI V2 trong phạm vi feature này.
- **SC-010**: Ít nhất 90% người duyệt từ sản phẩm, thiết kế, QA và phát triển chấm mức nhất quán và khả năng sử dụng của bộ base từ 4/5 trở lên; không còn vấn đề mức nghiêm trọng cao chưa xử lý trước phase migration màn hình.
